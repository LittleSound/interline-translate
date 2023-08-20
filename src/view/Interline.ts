import type { CodeLensProvider, ProviderResult, Range, TextDocument } from 'vscode'
import { CodeLens } from 'vscode'
import { config } from '~/config'

export function GapLinesTextDecoration(text: string, options?: { character?: number }) {
  const { character = 0 } = options || {}
  return {
    after: {
      textDecoration: `none; position: absolute; bottom: ${-1.3 / config.textSize}em; left: ${character / config.textSize}ch; font-size: ${config.textSize}em;`,
      contentText: text,
      color: 'var(--vscode-editorCodeLens-foreground)',
    },
  }
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
