import { computed, reactive, ref } from '@vue/reactivity'
import { Uri, workspace } from 'vscode'
import { EXT_NAMESPACE } from './meta'
import { useExtensionContext } from './dependence/extensionContext'
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

function createConfigRef<T>(key: string, defaultValue: T, isGlobal = true) {
  return computed({
    get: () => {
      // to force computed update
      // eslint-disable-next-line no-unused-expressions
      _configState.value
      return getConfig<T>(key) ?? defaultValue
    },
    set: (v) => {
      setConfig(key, v, isGlobal)
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
