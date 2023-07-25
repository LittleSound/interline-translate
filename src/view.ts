import { CancellationToken, CodeLens, CodeLensProvider, ProviderResult, Range, TextDocument, TextEditor, languages, window } from 'vscode';

const textSize = 0.9;

const helloWorldDecoration = (text: string, {
  character = 0
}: { character?: number }) => window.createTextEditorDecorationType({
	after: {
		textDecoration: `none; position: absolute; bottom: ${-1.3/textSize}em; left: ${character/textSize}ch; font-size: ${textSize}em;`,
		contentText: text,
		color: 'var(--vscode-editorCodeLens-foreground)',
	},
});

export type DisplayOnGapLinesOption = {
  range: Range,
  text: string,
  character?: number,
};

export function displayOnGapLines(editor: TextEditor, options: DisplayOnGapLinesOption[]) {

	const nextLineList: Set<number> = new Set(options.filter(({ range }) => editor.document.lineCount > range.end.line).map(({ range }) => range.end.line + 1));

  languages.registerCodeLensProvider(
		{ scheme: 'file' },
		new HelloWorldCodeLensProvider(
			Array.from(nextLineList).map(line => editor.document.lineAt(line).range)
		),
	);

	options.forEach(option => {
		const { range, text, character = 0 } = option;
		editor.setDecorations(helloWorldDecoration(text, { character }), [range]);
	});
}

export class HelloWorldCodeLensProvider implements CodeLensProvider {
	putRangeList: Range[] = [];

	constructor(putRangeList: Range[]) {
		this.putRangeList = putRangeList;
	}

	provideCodeLenses(document: TextDocument, token: CancellationToken): ProviderResult<CodeLens[]> {
		const codeLens: CodeLens[] = [];
		this.putRangeList.forEach((range) => {
			codeLens.push(new CodeLens( range, {
				title: ' ',
				command: '',
				arguments: [document],
			}));
		});
		return codeLens;
	}
}
