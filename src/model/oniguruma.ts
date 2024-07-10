import { Uri, workspace } from 'vscode'
import { OnigScanner, OnigString, loadWASM } from 'vscode-oniguruma'
import { config } from '~/config'

export async function getOnigurumaLib() {
  const wasmUri = Uri.joinPath(config.extensionUri, './out/onig.wasm')

  const onigWasm = await workspace.fs.readFile(wasmUri)
  const buffer = onigWasm.buffer.slice(onigWasm.byteOffset, onigWasm.byteOffset + onigWasm.byteLength)

  const onigurumaLib = await loadWASM(buffer).then(() => {
    return {
      createOnigScanner(patterns: string[]) { return new OnigScanner(patterns) },
      createOnigString(content: string) { return new OnigString(content) },
    }
  })

  return onigurumaLib
}
