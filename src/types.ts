import type { Extension } from 'vscode'

export interface GrammarExtension<T = any> extends Extension<T> {
  languages: {
    id: number
    name: string
  }
  value: any
}

export interface ContributesGrammar {
  language: string
  scopeName: string
  path: string
  embeddedLanguages: EmbeddedLanguagesMap
  tokenTypes: ContributesGrammarTokenTypes
  injectTo: string[]
}

export interface EmbeddedLanguagesMap {
  [scopeName: string]: string
}

export interface ContributesGrammarTokenTypes {
  [scopeName: string]: string
}
