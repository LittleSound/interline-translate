import type { ExtensionContext } from 'vscode'
import { defineDependency } from '~/context'

export const useExtensionContext = defineDependency<ExtensionContext>('ExtensionContext')
