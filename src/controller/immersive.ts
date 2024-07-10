import { MarkdownString, Range, commands, window, workspace } from 'vscode'
import type { TextEditor } from 'vscode'
import { effect, toRefs } from '@vue/reactivity'
import { knownWords, onConfigUpdated } from '~/config'
import { REGEX_FIND_PHRASES } from '~/regex'
import { GapLinesTextDecoration } from '~/view/Interline'
import type { DecorationMatch } from '~/types'
import { clearTranslationCache, useTranslationCache } from '~/model/cache'
import type { Context } from '~/context'
import { translateDocument, useTranslationMeta } from '~/model/translator'
import { useExtensionContext } from '~/dependence'
import { CommentScopes, StringScopes, findScopesRange, isComment, isKeyword, isString, parseDocumentToTokens } from '~/model/grammar'
import { usePlaceholderCodeLensProvider } from '~/view/codeLens'
import { showTranslatePopmenu } from '~/view/quickInput'
import { useStore } from '~/store'
import { extractPhrases } from '~/model/extract'
import { EXT_NAMESPACE } from '~/meta'

export function RegisterTranslator(ctx: Context) {
  const extCtx = useExtensionContext(ctx)

  const beTranslatedTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none;',
  })

  const store = useStore(ctx)
  const {
    enableContinuousTranslation,
    enableContinuousTranslationOnce,
    displayOriginalText,
    callingTranslateService,
  } = toRefs(store)

  let decorations: DecorationMatch[] = []
  let editor: TextEditor | undefined

  const placeholderCodeLens = usePlaceholderCodeLensProvider()

  const regex = REGEX_FIND_PHRASES

  async function updateDecorations() {
    if (!editor)
      return

    if (displayOriginalText.value) {
      refreshDecorations()
      return
    }

    const text = editor.document.getText()

    const meta = useTranslationMeta()
    const translationCache = useTranslationCache(ctx, meta.from, meta.to)

    decorations = []

    const tokens = await parseDocumentToTokens({ textDocument: editor.document })

    for (const { phrase, match, translated } of extractPhrases(text)) {
      const translatedText = translated
        ? phrase
        : translationCache.get(phrase)
      if (!translatedText)
        continue

      const startPos = editor.document.positionAt(match.index)
      const endPos = editor.document.positionAt(match.index + phrase.length)
      const range = new Range(startPos, endPos)

      if (isComment(startPos.character, tokens[startPos.line])) {
        const scopesRange = findScopesRange({
          position: startPos,
          tokensOfDoc: tokens,
          refScopes: CommentScopes,
        })
        if (scopesRange) {
          // skip the comment
          regex.lastIndex = editor.document.offsetAt(scopesRange.end)
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
          // skip the string
          regex.lastIndex = editor.document.offsetAt(scopesRange.end)
        }
        continue
      }

      if (isKeyword(startPos.character, tokens[startPos.line]))
        continue

      const markdown = new MarkdownString([
        `$(globe) ${phrase} → ${translatedText}`,
        '',
        `[Mark as known](command:interline-translate.markKnownPhrase?${encodeURIComponent(JSON.stringify([phrase]))})`,
      ].join('\n'))
      markdown.isTrusted = true
      markdown.supportThemeIcons = true

      decorations.push({
        key: phrase,
        range,
        renderOptions: GapLinesTextDecoration(translatedText),
        hoverMessage: markdown,
      })
    }

    refreshDecorations()
  }

  function refreshDecorations() {
    if (!editor)
      return

    if (displayOriginalText.value) {
      editor.setDecorations(beTranslatedTextDecoration, [])
      placeholderCodeLens.clean(editor.document)
      return
    }

    editor.setDecorations(beTranslatedTextDecoration, decorations)

    const lineCount = editor!.document.lineCount
    const nextLineList = new Set(
      decorations
        .filter(({ range }) => lineCount > range.end.line)
        .map(({ range }) => range.end.line + 1),
    )

    placeholderCodeLens.set(editor.document, Array.from(nextLineList))
  }

  async function translateImmediately() {
    if (!editor)
      return

    if (displayOriginalText.value || (!enableContinuousTranslation.value && !enableContinuousTranslationOnce.value))
      return

    enableContinuousTranslationOnce.value = false

    callingTranslateService.value = true

    const meta = useTranslationMeta()
    await translateDocument(ctx, {
      textDocument: editor!.document,
      from: meta.from,
      to: meta.to,
    }).finally(() => callingTranslateService.value = false)
    updateDecorations()
  }

  let timeoutTD: NodeJS.Timer | undefined

  function triggerTranslateDocument(_editor?: TextEditor, immediately = false) {
    updateEditor(_editor)
    if (timeoutTD) {
      clearTimeout(timeoutTD)
      timeoutTD = undefined
    }

    timeoutTD = setTimeout(translateImmediately, immediately ? 0 : 2000)
  }

  function updateEditor(_editor?: TextEditor) {
    if (!_editor || editor === _editor)
      return
    editor = _editor
    decorations = []
  }

  window.onDidChangeActiveTextEditor((e) => {
    triggerTranslateDocument(e)
    updateDecorations()
  }, null, extCtx.subscriptions)

  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document) {
      triggerTranslateDocument(window.activeTextEditor)
      updateDecorations()
    }
  }, null, extCtx.subscriptions)

  workspace.onDidChangeConfiguration(async () => {
    onConfigUpdated()
    triggerTranslateDocument()
    updateDecorations()
  }, null, extCtx.subscriptions)

  window.onDidChangeVisibleTextEditors((editors) => {
    triggerTranslateDocument(editors[0])
    updateDecorations()
  }, null, extCtx.subscriptions)

  window.onDidChangeTextEditorSelection((e) => {
    updateEditor(e.textEditor)
    refreshDecorations()
  })

  effect(() => {
    if (enableContinuousTranslation.value || enableContinuousTranslationOnce.value)
      triggerTranslateDocument(window.activeTextEditor, true)
  })

  effect(() => {
    if (displayOriginalText.value)
      refreshDecorations()
  })

  extCtx.subscriptions.push(commands.registerCommand('interline-translate.startTranslatingDocuments', () => {
    displayOriginalText.value = false
    enableContinuousTranslation.value = true
  }))
  extCtx.subscriptions.push(commands.registerCommand('interline-translate.stopTranslatingDocuments', () => {
    enableContinuousTranslation.value = false
    displayOriginalText.value = true
  }))
  extCtx.subscriptions.push(commands.registerCommand('interline-translate.toggleTranslatingDocuments', () => {
    enableContinuousTranslation.value = !enableContinuousTranslation.value
    displayOriginalText.value = !enableContinuousTranslation.value
  }))
  extCtx.subscriptions.push(commands.registerCommand('interline-translate.translateTheDocumentOnce', () => {
    displayOriginalText.value = false
    enableContinuousTranslationOnce.value = true
  }))
  extCtx.subscriptions.push(commands.registerCommand('interline-translate.displayOriginalText', () => {
    enableContinuousTranslationOnce.value = false
    displayOriginalText.value = true
  }))

  extCtx.subscriptions.push(commands.registerCommand('interline-translate.showTranslatePopmenu', () => {
    showTranslatePopmenu(ctx)
  }))

  extCtx.subscriptions.push(commands.registerCommand('interline-translate.clearTranslationCache', () => {
    clearTranslationCache(ctx)
  }))

  extCtx.subscriptions.push(commands.registerCommand('interline-translate.markKnownPhrase', async (phrase: string) => {
    const configs = workspace.getConfiguration(EXT_NAMESPACE)
    const words = configs.get<string[]>('knownWords', [])
    const parts = phrase.split(' ')
    for (const part of parts) {
      if (!words.includes(part))
        words.push(part)
    }
    await configs.update('knownWords', words, true)
  }))

  extCtx.subscriptions.push(commands.registerCommand('interline-translate.showDebugReport', async () => {
    const data = {
      knownWords: knownWords.value,
    }

    const doc = await workspace.openTextDocument({
      content: JSON.stringify(data, null, 2),
      language: 'json',
    })

    await window.showTextDocument(doc)
  }))
}
