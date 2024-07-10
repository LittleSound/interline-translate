import type { Position, TextDocument } from 'vscode'
import { Range, UIKind, Uri, env, extensions, workspace } from 'vscode'
import type { IToken } from 'vscode-textmate'
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate'
import type { ContributesGrammar, GrammarExtension } from '~/types'
import { } from 'vscode-oniguruma'
import { getOnigurumaLib } from '~/model/oniguruma'
import type { Context } from '~/context'

let languageId = 2
let grammarExtensions: GrammarExtension[] = []
const scopeNameGrammarPair = new Map<string, { grammarExtension: GrammarExtension<any>; contributesGrammar: ContributesGrammar }>()
const languageScopeNamePair = new Map<string, string>()

export function getGrammarExtensions() {
  return grammarExtensions
}

export async function RegisterGrammar(ctx: Context) {
  grammarExtensions = extensions.all.filter(({ packageJSON }) => {
    return packageJSON.contributes && packageJSON.contributes.grammars
  }).map((ext) => {
    const { packageJSON } = ext
    const contributesLanguages = packageJSON.contributes.languages || []
    const languages = contributesLanguages.map((item: any) => {
      return {
        id: languageId++,
        name: item.id,
      }
    })
    return {
      ...ext,
      languages,
      value: packageJSON.contributes.grammars,
    }
  })

  // If it is a remote environment, use the built-in syntax of the plugin.
  if (env.remoteName)
    await registerRemoteGrammar(ctx)

  // eslint-disable-next-line no-console
  console.log('grammarExtensions:', grammarExtensions)

  grammarExtensions.forEach((grammarExtension) => {
    grammarExtension.value.forEach((grammar) => {
      scopeNameGrammarPair.set(grammar.scopeName, {
        grammarExtension,
        contributesGrammar: grammar,
      })

      const language = grammar.language
      if (language)
        languageScopeNamePair.set(language, grammar.scopeName)
    })
  })
}

// eslint-disable-next-line unused-imports/no-unused-vars
export async function registerRemoteGrammar(ctx: Context) {
  // async function readResources(context: ExtensionContext) {
  //   const resources = await readdirSync(`${context.extensionPath}/resources`)
  //   return Promise.all(resources.map(async (extension) => {
  //     return {
  //       packageJSON: JSON.parse(await readFileSync(`${context.extensionPath}/resources/${extension}/package.json`, 'utf-8')),
  //       extensionLocation: `${context.extensionPath}/resources/${extension}`,
  //     }
  //   }))
  // }

  //   const inner = await readResources(context)
  //   const innergrammarExtensions: IGrammarExtensions[] = inner.filter(({ packageJSON }) => {
  //     return packageJSON.contributes && packageJSON.contributes.grammars
  //   }).map(({ packageJSON, extensionLocation }) => {
  //     const contributesLanguages = packageJSON.contributes.languages || []
  //     const languages: ITMLanguageExtensionPoint[] = contributesLanguages.map((item: any) => {
  //       return {
  //         id: languageId++,
  //         name: item.id,
  //       }
  //     })
  //     return {
  //       languages,
  //       value: packageJSON.contributes.grammars,
  //       extensionLocation,
  //     }
  //   })
  //   grammarExtensions.push(...innergrammarExtensions)
}

let grammarRegistry: Registry

export function useGrammarRegistry() {
  grammarRegistry ??= new Registry({
    onigLib: getOnigurumaLib(),
    loadGrammar: async (scopeName) => {
      const { grammarExtension, contributesGrammar } = getGrammarInfoByScopeName(scopeName)
      if (!contributesGrammar || !grammarExtension)
        return null

      const GrammarUri = Uri.joinPath(grammarExtension.extensionUri, contributesGrammar.path)

      return workspace.fs.readFile(GrammarUri).then(async (res) => {
        const str = env.uiKind === UIKind.Web
          ? await arrayBufferToString(res)
          : res.toString()

        return parseRawGrammar(str, GrammarUri.fsPath)
      })
    },
  })

  return grammarRegistry
}

export function getGrammarInfoByScopeName(scopeName: string) {
  return { ...scopeNameGrammarPair.get(scopeName) }
}

export async function parseDocumentToTokens(options: { textDocument: TextDocument }): Promise<IToken[][]> {
  const { textDocument: doc } = options

  const tokensOfLines: IToken[][] = []

  const registry = useGrammarRegistry()

  const scopeName = languageScopeNamePair.get(doc.languageId)
  if (!scopeName)
    return tokensOfLines

  const grammar = await registry.loadGrammar(scopeName)
  if (!grammar)
    return tokensOfLines

  const lines = doc.getText().split('\n')

  let ruleStack = INITIAL
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineTokens = grammar.tokenizeLine(line, ruleStack)
    ruleStack = lineTokens.ruleStack

    tokensOfLines.push(lineTokens.tokens)
  }

  return tokensOfLines
}

function arrayBufferToString(uint8array: Uint8Array): Promise<string> {
  return new Promise((resolve) => {
    const bb = new Blob([uint8array])
    // @ts-expect-error web only
    const f = new FileReader()
    f.onload = function (e: any) {
      resolve(e.target.result)
    }
    f.readAsText(bb)
  })
}

export function findScopes(character: number, tokensOfLine: IToken[], refScopes: readonly string[]): { refScope: string; token: IToken; index: number } | undefined {
  let result
  tokensOfLine.some((token, index) => {
    const { scopes: tokenScopes, startIndex, endIndex } = token

    if (character < startIndex || character >= endIndex)
      return false

    return refScopes.some(refScope => tokenScopes.some((scope) => {
      const isPrefix = scope.startsWith(refScope)

      if (isPrefix) {
        result = {
          refScope,
          index,
          token,
        }
      }

      return isPrefix
    }))
  })

  return result
}

export const CommentScopes = [
  'punctuation.definition.comment',
  'comment.block',
  'comment.line',
] as const
export function isComment(character: number, tokensOfLine: IToken[]) {
  return !!findScopes(character, tokensOfLine, CommentScopes)
}

export const StringScopes = [
  'string.unquoted', // yaml, etc., unquoted String
  'string.interpolated', // dart language compatibility
  'string.quoted',
  'string.template',
  'punctuation.definition.string',
  'constant.character.escape',
  'text.html.derivative', // TODO: HTML needs separate optimization
  'string.regexp', // TODO: regexp needs separate optimization
] as const
export function isString(character: number, tokensOfLine: IToken[]) {
  return !!findScopes(character, tokensOfLine, StringScopes)
}

export const KeywordScopes = [
  'keyword',
  'storage.type',
  'support.type.primitive',
  'storage.modifier',
  'constant.language.boolean',
  'support.type.builtin',
] as const
export function isKeyword(character: number, tokensOfLine: IToken[]) {
  return !!findScopes(character, tokensOfLine, KeywordScopes)
}

// 获取 scope 的范围
export function findScopesRange(options: { tokensOfDoc: IToken[][]; refScopes: readonly string[]; position: Position }): Range | undefined {
  const { tokensOfDoc, refScopes, position } = options

  let startPos: Position | undefined
  let endPos: Position | undefined
  let indexPos = position.with()

  while (true) {
    const tokensOfLine = tokensOfDoc[indexPos.line]
    if (!tokensOfLine)
      break

    const found = findScopes(indexPos.character, tokensOfLine, refScopes)

    if (found) {
      startPos ??= indexPos.with(undefined, found.token.startIndex)
      endPos = indexPos.with(undefined, found.token.endIndex)

      indexPos = found.index === tokensOfLine.length - 1
        ? indexPos.with(indexPos.line + 1, 0)
        : indexPos.with(undefined, tokensOfLine[found.index + 1].startIndex)

      continue
    }

    break
  }

  return startPos && endPos
    ? new Range(startPos, endPos)
    : undefined
}
