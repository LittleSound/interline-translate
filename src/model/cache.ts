type languagePair = string
type originalText = string
type translatedText = string

export type TranslationCache = Map<originalText, translatedText>

export const translationCacheMap = new Map<languagePair, Map<originalText, translatedText>>()

export function useTranslationCache(from: string, to: string) {
  const languagePair = `${from}:${to}`
  let tc = translationCacheMap.get(languagePair)
  if (!tc) {
    tc = new Map()
    translationCacheMap.set(languagePair, tc)
  }
  return tc
}
