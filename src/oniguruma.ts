import { type ExtensionContext, Uri, workspace } from 'vscode'
import { OnigScanner, OnigString, loadWASM } from 'vscode-oniguruma'

export async function getOnigurumaLib(ctx: ExtensionContext) {
  // const wasmUri = Uri.joinPath(ctx.extensionUri, './node_modules/vscode-oniguruma/release/onig.wasm')

  const wasmUri = Uri.joinPath(ctx.extensionUri, './out/oniguruma.wasm')

  const onigWasm = await workspace.fs.readFile(wasmUri)

  const onigurumaLib = await loadWASM(onigWasm.buffer).then(() => {
    return {
      createOnigScanner(patterns: string[]) { return new OnigScanner(patterns) },
      createOnigString(content: string) { return new OnigString(content) },
    }
  })

  return onigurumaLib
}
