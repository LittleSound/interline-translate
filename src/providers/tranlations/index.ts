import { info as googleInfo } from './google'
import { info as bingInfo } from './bing'

export const translators = {
  google: googleInfo,
  bing: bingInfo,
}
export const translatorOptions = Object.values(translators)
