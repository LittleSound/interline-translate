import { window } from 'vscode'
import type { TextDocument } from 'vscode'
import { extractPhrases } from './extract'
import { CommentScopes, StringScopes, findScopesRange, isComment, isKeyword, isString, parseDocumentToTokens } from '~/model/grammar'
import { persistTranslationCache, useTranslationCache } from '~/model/cache'
import { config } from '~/config'
import type { Context } from '~/context'
import { translators } from '~/providers/tranlations'

export function useTranslationMeta() {
  // TODO: use config or automatically recognize from language
  const from = 'en'
  const to = config.defaultTargetLanguage
  return {
    from,
    to,
  }
}

export interface TranslateDocumentOptions {
  from: string
  to: string
  textDocument: TextDocument
}

export async function translateDocument(ctx: Context, options: TranslateDocumentOptions): Promise<Error | undefined> {
  const { textDocument, from, to } = options

  const translationCache = useTranslationCache(ctx, from, to)

  const fullText = textDocument.getText()

  const tokens = await parseDocumentToTokens({ textDocument })

  // const phrasesFromDoc = Array.from(new Set(text.match(regex) || []))
  //   .filter(phrase => !translationCache.has(phrase))

  const phrasesFromDoc: string[] = []
  const commentsFromDoc: string[] = []
  const stringsFromDoc: string[] = []

  for (const { match, phrase, regex, translated } of extractPhrases(fullText)) {
    if (translated)
      continue
    if (translationCache.has(phrase))
      continue

    // Deduplicate
    if (phrasesFromDoc.includes(phrase))
      continue

    const startPos = textDocument.positionAt(match.index)

    if (isComment(startPos.character, tokens[startPos.line])) {
      const scopesRange = findScopesRange({
        position: startPos,
        tokensOfDoc: tokens,
        refScopes: CommentScopes,
      })
      if (scopesRange) {
        const snippet = textDocument.getText(scopesRange)
        commentsFromDoc.push(snippet)

        // skip the comment
        regex.lastIndex = textDocument.offsetAt(scopesRange.end)
      }
      continue
    }

    if (isString(startPos.character, tokens[startPos.line])) {
      const scopesRange = findScopesRange({
        position: startPos,
        tokensOfDoc: tokens,
        refScopes: StringScopes,
      })
      if (scopesRange) {
        const snippet = textDocument.getText(scopesRange)
        stringsFromDoc.push(snippet)

        // skip the string
        regex.lastIndex = textDocument.offsetAt(scopesRange.end)
      }
      continue
    }

    if (isKeyword(startPos.character, tokens[startPos.line]))
      continue

    phrasesFromDoc.push(phrase)
  }

  // eslint-disable-next-line no-console
  console.log('phrasesFromDoc:', phrasesFromDoc)
  // eslint-disable-next-line no-console
  console.log('skip comments:', commentsFromDoc)
  // eslint-disable-next-line no-console
  console.log('skip strings:', stringsFromDoc)

  if (!phrasesFromDoc.length)
    return

  const translator = translators.value[config.translator]
  const translationResult = await translator.translate({
    text: phrasesFromDoc.join('\n'),
    from: from as keyof typeof translator.supportLanguage,
    to: to as keyof typeof translator.supportLanguage,
  })

  if (!translationResult.ok) {
    window.showErrorMessage(translationResult.message)
    const error = new Error(translationResult.message)
    error.stack = (translationResult.originalError as any)?.stack
    console.error(error)
    return error
  }

  const translatedPhrases = translationResult.text.split('\n')

  phrasesFromDoc.forEach((phrase, index) => {
    const tp = translatedPhrases[index]
    if (tp)
      translationCache.set(phrase, tp)
  })

  persistTranslationCache(ctx)
}
