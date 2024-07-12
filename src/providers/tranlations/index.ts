import { computed } from '@vue/reactivity'
import { info as googleInfo } from './google'
import { info as bingInfo } from './bing'
import { externalTranslators } from './extensions'

const builtInTranslators = {
  google: googleInfo,
  bing: bingInfo,
}

export const translators = computed(() => {
  return Object.assign({}, builtInTranslators, externalTranslators.value)
})
export const translatorOptions = computed(() => Object.values(translators.value))
