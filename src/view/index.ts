import type { Range, TextEditor } from 'vscode'
import { window } from 'vscode'
import { usePlaceholderCodeLensProvider } from './codeLens'
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

  usePlaceholderCodeLensProvider().add(editor.document, Array.from(nextLineList))

  options.forEach((option) => {
    const { range, text, character = 0 } = option
    editor.setDecorations(helloWorldDecoration(text, { character }), [range])
  })
}
