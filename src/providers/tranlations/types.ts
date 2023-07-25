
export interface TranslationResultSuccess {
  ok: true;
  text: string;
}

export interface TranslationResultFail {
  ok: false;
  message: string;
  originalError: unknown;
}

export type TranslationResult = TranslationResultSuccess | TranslationResultFail;

export interface TranslationParameters {
  text: string,
  from: string,
  to: string
}
