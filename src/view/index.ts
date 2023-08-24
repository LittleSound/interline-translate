import type { CancellationToken, CodeLensProvider, ProviderResult, Range, TextDocument, TextEditor } from 'vscode'
import { CodeLens, languages, window } from 'vscode'
import { config } from '~/config'

function helloWorldDecoration(text: string, {
  character = 0,
}: { character?: number }) {
  return window.createTextEditorDecorationType({
    before: {
      textDecoration: `none; font-size: ${config.textSize}em; display: inline-block; position: relative; width: 0; bottom: ${-1.3 / config.textSize}em; left: ${character / config.textSize}ch;`,
      contentText: text,
      color: 'var(--vscode-editorCodeLens-foreground)',
    },
  })
}

export interface DisplayOnGapLinesOption {
  range: Range
  text: string
  character?: number
}

export function displayOnGapLines(editor: TextEditor, options: DisplayOnGapLinesOption[]) {
  const nextLineList: Set<number> = new Set(options.filter(({ range }) => editor.document.lineCount > range.end.line).map(({ range }) => range.end.line + 1))

  languages.registerCodeLensProvider(
    { scheme: 'file' },
    new HelloWorldCodeLensProvider(
      Array.from(nextLineList).map(line => editor.document.lineAt(line).range),
    ),
  )

  options.forEach((option) => {
    const { range, text, character = 0 } = option
    editor.setDecorations(helloWorldDecoration(text, { character }), [range])
  })
}

export class HelloWorldCodeLensProvider implements CodeLensProvider {
  putRangeList: Range[] = []

  constructor(putRangeList: Range[]) {
    this.putRangeList = putRangeList
  }

  provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]> {
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
