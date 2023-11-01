import type { WritableComputedRef } from '@vue/reactivity'
import { computed, reactive, ref } from '@vue/reactivity'
import { Uri, workspace } from 'vscode'
import { EXT_NAMESPACE } from './meta'
import { useExtensionContext } from './dependence'
import type { Context } from '~/context'

const _configState = ref(0)

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
  const state = ref<T | undefined>(defaultValue)

  return computed<T>({
    get: () => {
      // to force computed update
      // eslint-disable-next-line no-unused-expressions
      _configState.value
      return state.value as T ?? getConfig<T>(key) ?? defaultValue
    },
    set: (v: any) => {
      state.value = v as any
      setConfig(key, v, isGlobal).finally(() => state.value = undefined)
    },
  })
}

export function onConfigUpdated() {
  _configState.value = Date.now()
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
})

export function registerConfig(ctx: Context) {
  const extCtx = useExtensionContext(ctx)
  config.extensionUri = extCtx.extensionUri
}
