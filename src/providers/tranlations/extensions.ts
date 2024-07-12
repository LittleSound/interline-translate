import { computed, effect, reactive, shallowReactive } from '@vue/reactivity'
import { extensions } from 'vscode'
import type { TranslationParameters, TranslationProviderInfo, TranslationResult } from './types'
import type { Context } from '~/context'
import { invoke } from '~/utils'
import { config, languageOptions } from '~/config'

const allSupportLanguage = Object.fromEntries(languageOptions.map(item => [item.description!, item.description!]))

export interface ITranslateExtensionConfig {
  extensionId: string
  title: string
  category?: string
  Ctor?: new () => any
  translate: string
  instance?: any
  supportLanguage: Record<string, string | undefined>
  promise?: Promise<any>
}

export interface ITranslateRegistry {
  (translation: string, translate: new () => any): void
}

const translateConfig: Map<string, ITranslateExtensionConfig> = reactive(new Map())

export const externalTranslators = computed(() => {
  return Object.fromEntries(Array.from(translateConfig.entries())
    .map(([name, item]) => <[string, TranslationProviderInfo]>[name, {
      name,
      label: item.title,
      needs: [],
      supportLanguage: item.supportLanguage,
      translate: options => translateWithConf(name, item, options),
    }]))
})

// eslint-disable-next-line unused-imports/no-unused-vars
export function registerExtensionTranslate(ctx: Context) {
  loadExtensionTranslate()
  extensions.onDidChange(() => loadExtensionTranslate())
}

export function loadExtensionTranslate() {
  const currentKeys = new Set<string>()
  extensions.all
    .filter(ext => ext?.packageJSON?.contributes?.translates?.length > 0)
    .forEach((extension) => {
      const translates = extension.packageJSON.contributes.translates

      for (const { title, translate, category } of translates) {
        if (!title || !translate)
          return
        const key = `${extension.id}-${translate}`
        currentKeys.add(key)

        if (!translateConfig.get(key)) {
          translateConfig.set(key, shallowReactive({
            extensionId: extension.id,
            translate,
            title,
            category,
            supportLanguage: allSupportLanguage,
          }))
        }
      }
    })

  for (const key of translateConfig.keys()) {
    if (!currentKeys.has(key))
      translateConfig.delete(key)
  }
}

async function translateWithConf(name: string, conf: ITranslateExtensionConfig, { text, from, to }: TranslationParameters): Promise<TranslationResult> {
  function msgPerfix(text: string) {
    return `[Interline Translate] ${conf.title} (${name}) / ${text}`
  }

  try {
    if (!conf.instance)
      await activateWithConf(name, conf)
  }
  catch (e) {
    return {
      ok: false,
      message: msgPerfix('Activate Failed'),
      originalError: e,
    }
  }

  try {
    const res = await conf.instance.translate(text, { from, to })
    return {
      ok: true,
      text: res,
    }
  }
  catch (e) {
    return {
      ok: false,
      message: msgPerfix(typeof e === 'object' ? (e as any)?.message : 'Translate Failed: Unknown Error'),
      originalError: e,
    }
  }
}

async function activateWithConf(name: string, conf: ITranslateExtensionConfig) {
  if (conf.promise)
    return conf.promise

  const extension = extensions.all.find(extension => extension.id === conf.extensionId)
  if (!extension)
    return
  try {
    conf.promise = invoke(async () => {
      await extension.activate()
      if (!extension.exports || !extension.exports.extendTranslate)
        throw new Error(`Invalid extension: ${name}`)

      await extension
        .exports
        .extendTranslate((_: any, Translate: new () => any) => {
          conf.Ctor = Translate
          conf.instance = new conf.Ctor()

          if (typeof conf.instance?.isSupported === 'function') {
            const supportLanguage = Object.fromEntries(languageOptions
              .filter(item => conf.instance.isSupported(item.description!))
              .map(item => [item.description!, item.description!]))
            conf.supportLanguage = supportLanguage
          }
        })
    })
    await conf.promise
  }
  finally {
    conf.promise = undefined
  }
}

// clear instance
let oldTranslator: string | undefined
effect(() => {
  const name = config.translator
  if (name !== oldTranslator && translateConfig.has(name))
    translateConfig.get(name)!.instance = undefined
  oldTranslator = name
})
