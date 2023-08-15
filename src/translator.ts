import { CodeLens, Range, commands, languages, window, workspace } from 'vscode'
import type { CodeLensProvider, DecorationOptions, ExtensionContext, ProviderResult, TextDocument, TextEditor } from 'vscode'
import { effect, ref } from '@vue/reactivity'
import { config, onConfigUpdated } from './config'
import { REGEX_FIND_PHRASES } from './regex'
import { translate } from './providers/tranlations/google'
import { displayOnGapLines } from './view'
import { parseDocumentToTokens } from './grammar'

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export class PlaceholderCodeLensProvider implements CodeLensProvider {
  public putRangeList: Range[] = []

  constructor(putRangeList: Range[]) {
    this.putRangeList = putRangeList
  }

  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    const codeLens: CodeLens[] = []
    this.putRangeList.forEach((range) => {
      codeLens.push(new CodeLens(range, {
        title: ' ',
        command: '',
        arguments: [document],
      }))
    })
    return codeLens
  }
}

export function RegisterTranslator(ctx: ExtensionContext) {
  const beTranslatedTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none;',
  })

  const enableContinuousTranslation = ref(false)
  const enableContinuousTranslationOnce = ref(false)
  const displayOriginalText = ref(false)

  const translationCache = new Map<string, string>()

  let decorations: DecorationMatch[] = []
  let editor: TextEditor | undefined

  const placeholderCodeLens = new PlaceholderCodeLensProvider([])

  const regex = REGEX_FIND_PHRASES

  async function translateDocument() {
    if (!editor)
      return

    if (displayOriginalText.value || (!enableContinuousTranslation.value && !enableContinuousTranslationOnce.value))
      return
    enableContinuousTranslationOnce.value = false

    const text = editor.document.getText()

    const phrasesFromDoc = Array.from(new Set(text.match(regex) || []))
      .filter(phrase => !translationCache.has(phrase))

    if (!phrasesFromDoc.length) {
      updateDecorations()
      return
    }

    const translationResult = await translate({
      text: phrasesFromDoc.join('\n'),
      from: 'en',
      to: config.defaultTargetLanguage as any,
    })

    if (!translationResult.ok) {
      window.showErrorMessage(translationResult.message)
      updateDecorations()
      return
    }

    const translatedPhrases = translationResult.text.split('\n')

    phrasesFromDoc.forEach((phrase, index) => {
      const tp = translatedPhrases[index]
      if (tp)
        translationCache.set(phrase, tp)
    })

    updateDecorations()
  }

  function updateDecorations() {
    if (!editor)
      return

    if (displayOriginalText.value) {
      refreshDecorations()
      return
    }

    const text = editor.document.getText()

    decorations = []

    let match: RegExpExecArray | null
    regex.lastIndex = 0

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

  let timeoutTD: NodeJS.Timer | undefined

  function triggerTranslateDocument(_editor?: TextEditor, immediately = false) {
    updateEditor(_editor)
    if (timeoutTD) {
      clearTimeout(timeoutTD)
      timeoutTD = undefined
    }
    timeoutTD = setTimeout(() => {
      translateDocument()
    }, immediately ? 0 : 2000)
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
  }, null, ctx.subscriptions)

  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document) {
      triggerTranslateDocument(window.activeTextEditor)
      updateDecorations()
    }
  }, null, ctx.subscriptions)

  workspace.onDidChangeConfiguration(async () => {
    onConfigUpdated()
    triggerTranslateDocument()
    updateDecorations()
  }, null, ctx.subscriptions)

  window.onDidChangeVisibleTextEditors((editors) => {
    triggerTranslateDocument(editors[0])
    updateDecorations()
  }, null, ctx.subscriptions)

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

  ctx.subscriptions.push(commands.registerCommand('sidecar-translate.startTranslatingDocuments', () => {
    displayOriginalText.value = false
    enableContinuousTranslation.value = true
  }))
  ctx.subscriptions.push(commands.registerCommand('sidecar-translate.stopTranslatingDocuments', () => {
    enableContinuousTranslation.value = false
  }))
  ctx.subscriptions.push(commands.registerCommand('sidecar-translate.translateTheDocumentOnce', () => {
    displayOriginalText.value = false
    enableContinuousTranslationOnce.value = true
  }))
  ctx.subscriptions.push(commands.registerCommand('sidecar-translate.displayOriginalText', () => {
    enableContinuousTranslationOnce.value = false
    displayOriginalText.value = true
    console.log('displayOriginalText', displayOriginalText.value)
  }))

  // Translate selected text
  ctx.subscriptions.push(commands.registerCommand('sidecar-translate.translateSelectedText', async () => {
    console.log('start sidecar-translate.translateSelectedText')
    const activeEditor = window.activeTextEditor
    if (!activeEditor)
      return

    const tokens = await parseDocumentToTokens({
      context: ctx,
      textDocument: activeEditor.document,
    })

    console.log(`Active Document Grammar Tokens(length:${tokens.length}):`)
    console.log('line1:', tokens[0])

    let range: Range = activeEditor.selection

    // If the user has not selected any text, use the word where the cursor is located.
    if (range.start.isEqual(range.end))
      range = activeEditor.document.getWordRangeAtPosition(range.start) || range

    const res = await translate({
      text: activeEditor.document.getText(range),
      from: 'en',
      to: config.defaultTargetLanguage as any,
    })

    if (!res.ok) {
      window.showErrorMessage(res.message)
      return
    }

    displayOnGapLines(activeEditor, [
      {
        range,
        text: res.text,
        character: range.isSingleLine ? range.start.character : 0,
      },
    ])
  }))
}

function GapLinesTextDecoration(text: string, options?: { character?: number }) {
  const { character = 0 } = options || {}
  return {
    after: {
      textDecoration: `none; position: absolute; bottom: ${-1.3 / config.textSize}em; left: ${character / config.textSize}ch; font-size: ${config.textSize}em;`,
      contentText: text,
      color: 'var(--vscode-editorCodeLens-foreground)',
    },
  }
}
