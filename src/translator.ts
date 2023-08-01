import { CodeLens, Range, languages, window, workspace } from 'vscode'
import type { CodeLensProvider, DecorationOptions, ExtensionContext, ProviderResult, TextDocument, TextEditor } from 'vscode'
import { config, onConfigUpdated } from './config'
import { REGEX_FIND_PHRASES } from './regex'
import { translate } from './providers/tranlations/google'

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
  console.log('RegisterTranslator')
  const beTranslatedTextDecoration = window.createTextEditorDecorationType({
    textDecoration: 'none;',
  })

  const translationCache = new Map<string, string>()

  let decorations: DecorationMatch[] = []
  let editor: TextEditor | undefined

  const placeholderCodeLens = new PlaceholderCodeLensProvider([])

  const regex = REGEX_FIND_PHRASES

  async function translateDocument() {
    if (!editor)
      return

    const text = editor.document.getText()

    const phrasesFromDoc = Array.from(new Set(text.match(regex) || []))
      .filter(phrase => !translationCache.has(phrase))

    if (!phrasesFromDoc.length) {
      console.log('没有需要翻译的内容')
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

    console.log('翻译结果', phrasesFromDoc, translatedPhrases)

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

  let timeout: NodeJS.Timer | undefined
  function triggerUpdateDecorations(_editor?: TextEditor, immediately = false) {
    console.log('triggerUpdateDecorations')
    updateEditor(_editor)

    if (timeout) {
      clearTimeout(timeout)
      timeout = undefined
    }
    timeout = setTimeout(() => {
      translateDocument()
    }, immediately ? 0 : 200)
  }

  function updateEditor(_editor?: TextEditor) {
    if (!_editor || editor === _editor)
      return
    editor = _editor
    decorations = []
  }

  languages.registerCodeLensProvider({ scheme: 'file' }, placeholderCodeLens)

  window.onDidChangeActiveTextEditor((e) => {
    triggerUpdateDecorations(e)
  }, null, ctx.subscriptions)

  workspace.onDidChangeTextDocument((event) => {
    if (window.activeTextEditor && event.document === window.activeTextEditor.document)
      triggerUpdateDecorations(window.activeTextEditor)
  }, null, ctx.subscriptions)

  workspace.onDidChangeConfiguration(async () => {
    onConfigUpdated()
    triggerUpdateDecorations()
  }, null, ctx.subscriptions)

  window.onDidChangeVisibleTextEditors((editors) => {
    triggerUpdateDecorations(editors[0])
  }, null, ctx.subscriptions)

  window.onDidChangeTextEditorSelection((e) => {
    updateEditor(e.textEditor)
    refreshDecorations()
  })

  // on start up
  triggerUpdateDecorations(window.activeTextEditor, true)
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
