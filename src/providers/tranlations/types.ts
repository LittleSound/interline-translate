export interface TranslationResultSuccess {
  ok: true
  text: string
}

export interface TranslationResultFail {
  ok: false
  message: string
  originalError: unknown
}

export type TranslationResult = TranslationResultSuccess | TranslationResultFail

export interface TranslationParameters {
  text: string
  from: string
  to: string
}

export interface TranslationProviderInfo {
  name: string
  supportLanguage: Record<string, string | undefined>
  needs: { config_key: string; place_hold: string }[]
}
