import type { Context } from '~/context'
import { useExtensionContext } from '~/dependence'

type languagePair = string
type originalText = string
type translatedText = string

export type TranslationCache = Map<originalText, translatedText>

export const translationCacheMap = new Map<languagePair, Map<originalText, translatedText>>()

export function useTranslationCache(ctx: Context, from: string, to: string): Map<originalText, translatedText> {
  const ext = useExtensionContext(ctx)
  const languagePair = `${from}:${to}`
  let tc = translationCacheMap.get(languagePair)
  if (!tc) {
    tc = new Map(ext.globalState.get(`translations-${languagePair}`) || [])
    translationCacheMap.set(languagePair, tc)
  }
  return tc
}

export function persistTranslationCache(ctx: Context) {
  const ext = useExtensionContext(ctx)
  for (const [languagePair, tc] of translationCacheMap)
    ext.globalState.update(`translations-${languagePair}`, [...tc.entries()])
}

export function clearCache(ctx: Context) {
  const ext = useExtensionContext(ctx)
  translationCacheMap.clear()
  ext.globalState.keys()
    .forEach((key) => {
      if (key.startsWith('translations-'))
        ext.globalState.update(key, undefined)
    })
}
