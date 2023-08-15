import { type ExtensionContext, Uri, workspace } from 'vscode'
import { OnigScanner, OnigString, loadWASM } from 'vscode-oniguruma'

export async function getOnigurumaLib(ctx: ExtensionContext) {
  // const wasmUri = Uri.joinPath(ctx.extensionUri, './node_modules/vscode-oniguruma/release/onig.wasm')

  const wasmUri = Uri.joinPath(ctx.extensionUri, './out/oniguruma.wasm')
  console.log('start load wasm:', wasmUri.path, wasmUri)

  const onigWasm = await workspace.fs.readFile(wasmUri)
  const buffer = onigWasm.buffer.slice(onigWasm.byteOffset, onigWasm.byteOffset + onigWasm.byteLength)

  console.log('onigWasm:')
  console.log(onigWasm)

  const onigurumaLib = await loadWASM(buffer).then(() => {
    return {
      createOnigScanner(patterns: string[]) { return new OnigScanner(patterns) },
      createOnigString(content: string) { return new OnigString(content) },
    }
  })

  console.log('onigurumaLib:')
  console.log(onigurumaLib)

  return onigurumaLib
}
