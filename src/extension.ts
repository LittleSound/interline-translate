// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode'
import { displayOnGapLines } from './view'
import { translate } from './providers/tranlations/google'
import { config } from './config'
import { RegisterTranslator } from './translator'

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(ctx: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "sidecar-translate" is now active!')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand('sidecar-translate.helloWorld', async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage('Hello World from sidecar-translate!')
  })
  ctx.subscriptions.push(disposable)

  ctx.subscriptions.push(vscode.commands.registerCommand('sidecar-translate.whatTimeIsItNow', () => {
    vscode.window.showInformationMessage(`It is ${new Date().toLocaleTimeString()}`)
  }))

  ctx.subscriptions.push(vscode.commands.registerCommand('sidecar-translate.translateSelectedText', async () => {
    const activeEditor = vscode.window.activeTextEditor
    if (!activeEditor)
      return

    let range: vscode.Range = activeEditor.selection

    // If the user has not selected any text, use the word where the cursor is located.
    if (range.start.isEqual(range.end))
      range = activeEditor.document.getWordRangeAtPosition(range.start) || range

    const res = await translate({
      text: activeEditor.document.getText(range),
      from: 'en',
      to: config.defaultTargetLanguage as any,
    })

    if (!res.ok) {
      vscode.window.showErrorMessage(res.message)
      return
    }

    displayOnGapLines(activeEditor, [
      {
        range,
        text: res.text,
        character: range.isSingleLine ? range.start.character : 0,
      },
    ])
  }))

  RegisterTranslator(ctx)
}

// This method is called when your extension is deactivated
export function deactivate() {}
