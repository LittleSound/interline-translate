// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const textSize = 0.9;

const helloWorldDecoration = () => vscode.window.createTextEditorDecorationType({
	textDecoration: 'none; position: relative;',
	before: {
		textDecoration: `none; position: absolute; bottom: ${-1.3/textSize}em; left: ${6/textSize}ch; font-size: ${textSize}em;`,
		contentText: '设置存储',
		color: 'var(--vscode-editorCodeLens-foreground)',
	},
});


export class HelloWorldCodeLensProvider implements vscode.CodeLensProvider {
	putRangeList: vscode.Range[] = [];

	constructor(putRangeList: vscode.Range[]) {
		this.putRangeList = putRangeList;
	}

	provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
		const codeLens: vscode.CodeLens[] = [];
		this.putRangeList.forEach((range) => {
			codeLens.push(new vscode.CodeLens( range, {
				title: ' ',
				command: '',
				arguments: [document],
			}));
		});
		return codeLens;
	}

	resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
		console.log('resolveCodeLens');
		return codeLens;
	}
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "helloworldvscode" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('helloworldvscode.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from HelloWorldVSCode!');
	});
	context.subscriptions.push(disposable);

	context.subscriptions.push(vscode.commands.registerCommand('helloworldvscode.whatTimeIsItNow', () => {
		vscode.window.showInformationMessage('It is ' + new Date().toLocaleTimeString());
	}));

	context.subscriptions.push(vscode.commands.registerCommand('helloworldvscode.putAHelloWorld', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
		const cursorPosition = activeEditor.selection.active;

		console.log('cursorPosition.line', cursorPosition.line);

		const activeLine =  activeEditor.document.lineAt(cursorPosition.line);
		const activeLineNext =  activeEditor.document.lineAt(cursorPosition.line + 1);
		vscode.languages.registerCodeLensProvider({ scheme: 'file' }, new HelloWorldCodeLensProvider([activeLineNext.range]));
		activeEditor.setDecorations(helloWorldDecoration(), [activeLine.range]);
	}));
}

// This method is called when your extension is deactivated
export function deactivate() {}
