import { effect, reactive } from '@vue/reactivity'
import type { Context } from '~/context'
import { defineDependency } from '~/context'
import { useExtensionContext } from '~/dependence'

function initState(ctx: Context) {
  const ext = useExtensionContext(ctx)

  const enableContinuousTranslation = ext.globalState.get<boolean>('enableContinuousTranslation') ?? false
  const store = reactive({
    /** Translation is running */
    translating: false,
    enableContinuousTranslation,
    enableContinuousTranslationOnce: false,
    displayOriginalText: !enableContinuousTranslation,
    callingTranslateService: false,
  })

  effect(() => {
    ext.globalState.update('enableContinuousTranslation', store.enableContinuousTranslation)
  })

  return store
}

type StoreState = ReturnType<typeof initState>

export const useStore = defineDependency<StoreState>('Store')

export function registerStore(ctx: Context) {
  const state = initState(ctx)
  useStore.provide(ctx, state)
}
