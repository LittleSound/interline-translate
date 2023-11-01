import { reactive } from '@vue/reactivity'
import type { Context } from '~/context'
import { defineDependency } from '~/context'

function initState() {
  return reactive({
    /** Translation is running */
    translating: false,
    enableContinuousTranslation: false,
    enableContinuousTranslationOnce: false,
    displayOriginalText: true,
    callingTranslateService: false,
  })
}

type StoreState = ReturnType<typeof initState>

export const useStore = defineDependency<StoreState>('Store')

export function registerStore(ctx: Context) {
  const state = initState()
  useStore.provide(ctx, state)
}
