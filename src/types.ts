import type { DecorationOptions, Extension } from 'vscode'

export interface GrammarExtension<T = any> extends Extension<T> {
  languages: {
    id: number
    name: string
  }
  value: ContributesGrammar[]
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

export interface DecorationMatch extends DecorationOptions {
  key: string
}

export type Fn = (...p: any[]) => any
