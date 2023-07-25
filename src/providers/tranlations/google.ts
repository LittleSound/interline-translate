import { ofetch, FetchError } from 'ofetch';
import { config } from '../../config';
import { TranslationParameters, TranslationResult } from './types';

export const info = {
  name: 'google',
  // https://cloud.google.com/translate/docs/languages?hl=zh-cn
  supportLanguage: {
    auto: 'auto',
    zh_cn: 'zh-CN',
    zh_tw: 'zh-TW',
    ja: 'ja',
    en: 'en',
    ko: 'ko',
    fr: 'fr',
    es: 'es',
    ru: 'ru',
    de: 'de',
    it: 'it',
    tr: 'tr',
    pt: 'pt',
    pt_br: 'pt',
    vi: 'vi',
    id: 'id',
    th: 'th',
    ms: 'ms',
    ar: 'ar',
    hi: 'hi',
  },
  needs: [
    {
      config_key: 'google_proxy',
      place_hold: 'default: translate.google.com',
    },
  ],
};

export type SupportLanguage = keyof typeof info.supportLanguage;

export interface GoogleTranslationParameters extends TranslationParameters {
  from: SupportLanguage;
  to: SupportLanguage;
}

export async function translate(options: GoogleTranslationParameters): Promise<TranslationResult> {
    const { text, from, to } = options;
    const { supportLanguage } = info;

    if (text === '') {
      return {
        ok: false,
        message: 'Empty Text',
        originalError: null,
      };
    }

    if (!(from in supportLanguage) || !(to in supportLanguage)) {
      return {
        ok: false,
        message: 'Unsupported Language',
        originalError: null,
      };
    }

    let domain = config.googleProxy ?? 'translate.google.com';
    if (domain === '') {
      domain = 'translate.google.com';
    }

    try {
      let res = await ofetch(
        `${config.corsProxy}https://${domain}/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t`,
        {
          method: 'GET',
          headers: {
            'Origin': 'https://translate.google.com',
          },
          query: {
            client: 'gtx',
            sl: supportLanguage[from],
            tl: supportLanguage[to],
            hl: supportLanguage[to],
            ie: 'UTF-8',
            oe: 'UTF-8',
            otf: '1',
            ssel: '0',
            tsel: '0',
            kc: '7',
            q: text,
          },
        }
      );

      let target = '';
      if (res[2] === supportLanguage[to]) {
        let secondLanguage = config.secondLanguage ?? 'en';
        if (secondLanguage !== to) {
          return translate({
            ...options,
            to: secondLanguage as SupportLanguage
          });
        }
      }

      for (let r of res[0]) {
        if (r[0]) {
            target = target + r[0];
        }
      }

      return {
        ok: true,
        text: target.trim()
      };
    } catch(e) {
      if (e instanceof FetchError) {
        return {
          ok: false,
          message: `Http Request Error\nHttp Status: ${e.status}\n${JSON.stringify(e.data)}`,
          originalError: e,
        };
      }
      else {
        return {
          ok: false,
          message: typeof e === 'object' ? (e as any)?.message : 'Unknown Error',
          originalError: e,
        };
      }
    }
}
