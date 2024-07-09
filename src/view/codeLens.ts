import type { CodeLensProvider, ProviderResult, TextDocument } from 'vscode'
import { CodeLens, EventEmitter, Range, languages } from 'vscode'

class PlaceholderCodeLensProvider implements CodeLensProvider {
  public linesOfDoc = new Map<string, Set<number>>()

  changeCodeLensesEmitter = new EventEmitter<void>()

  onDidChangeCodeLenses = this.changeCodeLensesEmitter.event

  provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
    const codeLens: CodeLens[] = []
    const lines = this.linesOfDoc.get(document.uri.toString())
    if (!lines)
      return codeLens

    lines.forEach((line) => {
      codeLens.push(new CodeLens(new Range(
        line,
        0,
        line,
        0,
      ), {
        title: ' ',
        command: '',
        arguments: [document],
      }))
    })
    return codeLens
  }
}

let instance: PlaceholderCodeLensProvider

/** update CodeLens immediately */
function refresh() {
  instance.changeCodeLensesEmitter.fire()
}

function set(document: TextDocument, rangeList: number[]) {
  const uri = document.uri.toString()
  let lines = instance.linesOfDoc.get(uri)
  if (!lines) {
    lines = new Set()
    instance.linesOfDoc.set(uri, lines)
  }

  rangeList.forEach((line) => {
    lines!.add(line)
  })

  // Remove lines that are not in the rangeList
  lines.forEach((line) => {
    if (!rangeList.includes(line))
      lines!.delete(line)
  })

  refresh()
}

function clean(document: TextDocument) {
  const uri = document.uri.toString()
  instance.linesOfDoc.delete(uri)
  refresh()
}

function cleanAll() {
  instance.linesOfDoc.clear()
  refresh()
}

export function usePlaceholderCodeLensProvider() {
  if (!instance) {
    instance = new PlaceholderCodeLensProvider()
    languages.registerCodeLensProvider({ scheme: 'file' }, instance)
  }

  return {
    refresh,
    set,
    clean,
    cleanAll,
  }
}
