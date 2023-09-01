// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import type * as vscode from 'vscode'
import { useExtensionContext } from './dependence/extensionContext'
import { RegisterControllers } from './controller'
import { registerEntryButton } from './view/statusBar'
import { createContext } from '~/context'
import { RegisterGrammar } from '~/model/grammar'
import { registerConfig } from '~/config'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(extCtx: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "sidecar-translate" is now active!')

  const ctx = createContext()

  useExtensionContext.provide(ctx, extCtx)
  registerConfig(ctx)
  await RegisterGrammar(ctx)
  RegisterControllers(ctx)
  registerEntryButton()
}

// This method is called when your extension is deactivated
export function deactivate() {}
