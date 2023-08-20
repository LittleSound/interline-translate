import { Range, commands, languages, window, workspace } from 'vscode'
import type { TextEditor } from 'vscode'
import { effect, ref } from '@vue/reactivity'
import { onConfigUpdated } from '~/config'
import { REGEX_FIND_PHRASES } from '~/regex'
import { GapLinesTextDecoration, PlaceholderCodeLensProvider } from '~/view/Interline'
import type { DecorationMatch } from '~/types'
import { useTranslationCache } from '~/model/cache'
import type { Context } from '~/context'
import { translateDocument, useTranslationMeta } from '~/model/translator'
import { useExtensionContext } from '~/dependence/extensionContext'
import { isComment, isString, parseDocumentToTokens } from '~/model/grammar'

export function RegisterTranslator(ctx: Context) {
  const extCtx = useExtensionContext(ctx)

  const beTranslatedTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none;',
  })

  const enableContinuousTranslation = ref(false)
  const enableContinuousTranslationOnce = ref(false)
  const displayOriginalText = ref(false)

  let decorations: DecorationMatch[] = []
  let editor: TextEditor | undefined

  const placeholderCodeLens = new PlaceholderCodeLensProvider([])

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
    const translationCache = useTranslationCache(meta.from, meta.to)

    decorations = []

    let match: RegExpExecArray | null
    regex.lastIndex = 0

    const tokens = await parseDocumentToTokens({ textDocument: editor.document })

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(text))) {
      const key = match[0]
      if (!key)
        continue
      const translatedText = translationCache.get(key)
      if (!translatedText)
        continue

      const startPos = editor.document.positionAt(match.index)
      const endPos = editor.document.positionAt(match.index + key.length)
      const range = new Range(startPos, endPos)

      if (isComment(startPos.character, tokens[startPos.line]))
        continue
      if (isString(startPos.character, tokens[startPos.line]))
        continue

      decorations.push({
        key,
        range,
        renderOptions: GapLinesTextDecoration(translatedText, { character: range.isSingleLine ? range.start.character : 0 }),
      })
    }

    refreshDecorations()
  }

  function refreshDecorations() {
    if (!editor)
      return

    if (displayOriginalText.value) {
      editor.setDecorations(beTranslatedTextDecoration, [])
      placeholderCodeLens.putRangeList = []
      return
    }

    editor.setDecorations(beTranslatedTextDecoration, decorations)

    const lineCount = editor!.document.lineCount
    const nextLineList = new Set(
      decorations
        .filter(({ range }) => lineCount > range.end.line)
        .map(({ range }) => range.end.line + 1),
    )

    placeholderCodeLens.putRangeList = Array.from(nextLineList)
      .map(line => editor!.document.lineAt(line).range)
  }

  async function translateImmediately() {
    if (!editor)
      return

    if (displayOriginalText.value || (!enableContinuousTranslation.value && !enableContinuousTranslationOnce.value))
      return
    enableContinuousTranslationOnce.value = false

    const meta = useTranslationMeta()
    await translateDocument({
      textDocument: editor!.document,
      from: meta.from,
      to: meta.to,
    })
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

  languages.registerCodeLensProvider({ scheme: 'file' }, placeholderCodeLens)

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

  extCtx.subscriptions.push(commands.registerCommand('sidecar-translate.startTranslatingDocuments', () => {
    displayOriginalText.value = false
    enableContinuousTranslation.value = true
  }))
  extCtx.subscriptions.push(commands.registerCommand('sidecar-translate.stopTranslatingDocuments', () => {
    enableContinuousTranslation.value = false
  }))
  extCtx.subscriptions.push(commands.registerCommand('sidecar-translate.translateTheDocumentOnce', () => {
    displayOriginalText.value = false
    enableContinuousTranslationOnce.value = true
  }))
  extCtx.subscriptions.push(commands.registerCommand('sidecar-translate.displayOriginalText', () => {
    enableContinuousTranslationOnce.value = false
    displayOriginalText.value = true
  }))
}