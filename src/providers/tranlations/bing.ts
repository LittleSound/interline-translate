import { FetchError, ofetch } from 'ofetch'
import type { TranslationParameters, TranslationProviderInfo, TranslationResult } from './types'
import { createUnsupportedLanguageError } from './utils'
import { config } from '~/config'

export const info: TranslationProviderInfo = {
  name: 'bing',
  label: 'Bing Translate',
  // https://learn.microsoft.com/zh-CN/azure/cognitive-services/translator/language-support
  supportLanguage: {
    'auto': '',
    'zh-CN': 'zh-Hans',
    'zh-TW': 'zh-Hant',
    'yue': 'yue',
    'en': 'en',
    'ja': 'ja',
    'ko': 'ko',
    'fr': 'fr',
    'es': 'es',
    'ru': 'ru',
    'de': 'de',
    'it': 'it',
    'tr': 'tr',
    'pt-PT': 'pt-pt',
    'pt-BR': 'pt',
    'vi': 'vi',
    'id': 'id',
    'th': 'th',
    'ms': 'ms',
    'ar': 'ar',
    'hi': 'hi',
    'mn-Cyrl': 'mn-Cyrl',
    'mn-Mong': 'mn-Mong',
    'km': 'km',
    'nb-NO': 'nb',
    'fa': 'fa',
    'sv': 'sv',
    'pl': 'pl',
    'nl': 'nl',
    'uk': 'uk',
  },
  needs: [],
  translate,
}

export type SupportLanguage = keyof typeof info.supportLanguage

export interface BingTranslationParameters extends TranslationParameters {
  from: SupportLanguage
  to: SupportLanguage
}

const tokenUrl = 'https://edge.microsoft.com/translate/auth'
const translatorUrl = 'https://api-edge.cognitive.microsofttranslator.com/translate'

function msgPerfix(text: string) {
  return `[Interline Translate] Bing / ${text}`
}

export async function translate(options: BingTranslationParameters): Promise<TranslationResult> {
  const { text, from, to } = options
  const { supportLanguage } = info

  if (text === '') {
    return {
      ok: false,
      message: 'Empty Text',
      originalError: null,
    }
  }

  if (!(from in supportLanguage))
    return createUnsupportedLanguageError('from', from)
  if (!(to in supportLanguage))
    return createUnsupportedLanguageError('to', to)

  try {
    const tokenRes = await ofetch(`${config.corsProxy}${tokenUrl}`, {
      method: 'GET',
    }).then(res => ({
      ok: true as const,
      data: res,
    })).catch(e => ({
      ok: false as const,
      message: msgPerfix('Get Token Failed'),
      originalError: e,
    }))

    if (!tokenRes.ok)
      return tokenRes

    // https://cn.bing.com/translator/?ref=TThis&text=good&from=en&to=es
    const res = await ofetch(
        `${config.corsProxy}${translatorUrl}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${tokenRes.data}`,
          },
          query: {
            'from': supportLanguage[from],
            'to': supportLanguage[to],
            'api-version': '3.0',
            'includeSentenceLength': 'true',
          },
          body: [{ Text: text }],
        },
    )

    if (!res[0].translations) {
      console.error('Bing Translate Error with 200 status:', res)
      throw res
    }

    return {
      ok: true,
      text: res[0].translations[0].text.trim(),
    }
  }
  catch (e) {
    if (e instanceof FetchError) {
      let message = msgPerfix('Http Request Error')
      if (e.status)
        message = `\nHttp Status: ${e.status}\n${JSON.stringify(e.data)}`
      message += '\nCheck your network connection or choose another translation provider'

      return {
        ok: false,
        message,
        originalError: e,
      }
    }
    else {
      return {
        ok: false,
        message: msgPerfix(typeof e === 'object' ? (e as any)?.message : 'Unknown Error'),
        originalError: e,
      }
    }
  }
}
