import type { ExtensionContext } from 'vscode'
import { Uri, extensions, workspace } from 'vscode'
import { Registry, parseRawGrammar } from 'vscode-textmate'
import type { ContributesGrammar, GrammarExtension } from './types'
import { } from 'vscode-oniguruma'
import { getOnigurumaLib } from './oniguruma'

let grammarExtensions: GrammarExtension[] = []

export function getGrammarExtensions() {
  return grammarExtensions
}

export async function RegisterGrammar(ctx: ExtensionContext) {
  let languageId = 2
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
  // if (env.remoteName) {
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
  // }

  console.log('grammarExtensions:', grammarExtensions)

  // test read grammar file
  // const grammar = grammarExtensions[0]
  // const GrammarUri = Uri.joinPath(grammar.extensionUri, grammar.value[0].path)
  // console.log('grammar:', grammar)
  // console.log('GrammarUri:', GrammarUri)

  // workspace.fs.readFile(GrammarUri).then((res) => {
  //   const str = String.fromCharCode.apply(null, res as any)
  //   console.log('grammar file:', str)
  // })
}

// async function readResources(context: ExtensionContext) {
//   const resources = await readdirSync(`${context.extensionPath}/resources`)
//   return Promise.all(resources.map(async (extension) => {
//     return {
//       packageJSON: JSON.parse(await readFileSync(`${context.extensionPath}/resources/${extension}/package.json`, 'utf-8')),
//       extensionLocation: `${context.extensionPath}/resources/${extension}`,
//     }
//   }))
// }

let grammarRegistry: Registry

export function getGrammarRegistry(ctx: ExtensionContext) {
  if (!grammarRegistry) {
    grammarRegistry = new Registry({
      onigLib: getOnigurumaLib(ctx),
      loadGrammar: async (scopeName) => {
        const { grammarExtension, contributesGrammar } = getGrammarInfoByScopeName(scopeName)
        if (!contributesGrammar || !grammarExtension)
          return null

        const GrammarUri = Uri.joinPath(grammarExtension.extensionUri, contributesGrammar.path)
        return workspace.fs.readFile(GrammarUri).then((res) => {
          const str = String.fromCharCode.apply(null, res as any)
          return parseRawGrammar(str, GrammarUri.fsPath)
        })
      },
    })
  }

  return grammarRegistry
}

export function getGrammarInfoByScopeName(scopeName: string) {
  let contributesGrammar: ContributesGrammar | undefined

  const grammarExtension = grammarExtensions.find((item) => {
    contributesGrammar = item.value.find(grammar => grammar.scopeName === scopeName)
    return contributesGrammar
  })

  return {
    grammarExtension,
    contributesGrammar,
  }
}
