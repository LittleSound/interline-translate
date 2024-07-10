import type { TranslationResultFail } from './types'

export function createUnsupportedLanguageError(type: 'from' | 'to', lang: string): TranslationResultFail {
  return {
    ok: false,
    message: `Unsupported Language: ${type}: ${lang}`,
    originalError: null,
  }
}
