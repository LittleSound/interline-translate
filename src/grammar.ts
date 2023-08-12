import type { ExtensionContext, Uri } from 'vscode'
import { extensions } from 'vscode'

export interface GrammarExtension {
  languages: any
  value: any
  extensionUri: Uri
}

let grammarExtensions: GrammarExtension[] = []

export function getGrammarExtensions() {
  return grammarExtensions
}

export async function RegisterGrammar(ctx: ExtensionContext) {
  let languageId = 2
  grammarExtensions = extensions.all.filter(({ packageJSON }) => {
    return packageJSON.contributes && packageJSON.contributes.grammars
  }).map(({ packageJSON, extensionUri }) => {
    const contributesLanguages = packageJSON.contributes.languages || []
    const languages = contributesLanguages.map((item: any) => {
      return {
        id: languageId++,
        name: item.id,
      }
    })
    return {
      languages,
      value: packageJSON.contributes.grammars,
      extensionUri,
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
