import type { WritableComputedRef } from '@vue/reactivity'
import { computed, reactive, ref, shallowRef } from '@vue/reactivity'
import { Uri, workspace } from 'vscode'
import { EXT_NAMESPACE } from './meta'
import { useExtensionContext } from './dependence'
import type { Context } from '~/context'

const _configLastUpdated = ref(0)

function getConfig<T = any>(key: string): T | undefined {
  return workspace
    .getConfiguration()
    .get<T>(key)
}

async function setConfig(key: string, value: any, isGlobal = true) {
  // update value
  return await workspace
    .getConfiguration()
    .update(key, value, isGlobal)
}

function createConfigRef<T>(key: string, defaultValue: T, isGlobal = true): WritableComputedRef<T> {
  const state = shallowRef<T | undefined>(getConfig<T>(key) ?? defaultValue)
  let lastTimestamp = _configLastUpdated.value

  return computed<T>({
    get: () => {
      if (lastTimestamp !== _configLastUpdated.value) {
        state.value = getConfig<T>(key) ?? defaultValue
        lastTimestamp = _configLastUpdated.value
      }
      return state.value
    },
    set: (v: any) => {
      state.value = v as any
      setConfig(key, v, isGlobal).finally(() => state.value = undefined)
    },
  })
}

export function onConfigUpdated() {
  _configLastUpdated.value = Date.now()
}

export const config = reactive({
  defaultTargetLanguage: createConfigRef(`${EXT_NAMESPACE}.defaultTargetLanguage`, 'zh-CN'),
  secondLanguage: createConfigRef(`${EXT_NAMESPACE}.secondLanguage`, ''),

  // providers
  googleTranslateProxy: createConfigRef(`${EXT_NAMESPACE}.googleProxy`, ''),

  /** you can use https://cors-anywhere.herokuapp.com/ at "vscode for web" */
  corsProxy: createConfigRef(`${EXT_NAMESPACE}.corsProxy`, ''),

  textSize: 0.9,

  extensionUri: Uri.file(''),

  minWordLength: createConfigRef(`${EXT_NAMESPACE}.minWordLength`, 4, false),

  knownWords: createConfigRef<string[]>(`${EXT_NAMESPACE}.knownWords`, [], false),
})

export function isKnownWords(word: string) {
  return config.knownWords.includes(word.replace(/[^\w\._-]/g, ''))
}

export function isExcluded(phrase: string) {
  if (phrase.length < config.minWordLength)
    return true
  if (isKnownWords(phrase))
    return true
  // Skip phrase that contains no alphabet characters
  if (!phrase.match(/[a-zA-Z]/))
    return true
  return false
}

export function registerConfig(ctx: Context) {
  const extCtx = useExtensionContext(ctx)
  config.extensionUri = extCtx.extensionUri
}
