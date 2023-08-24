import type { Range } from 'vscode'
import { commands, window } from 'vscode'
import type { Context } from '~/context'
import { useExtensionContext } from '~/dependence/extensionContext'
import { useTranslationMeta } from '~/model/translator'
import { translate } from '~/providers/tranlations/google'
import { displayOnGapLines } from '~/view'

export function RegisterTranslateSelectedText(ctx: Context) {
  const extCtx = useExtensionContext(ctx)

  // Translate selected text
  extCtx.subscriptions.push(commands.registerCommand('sidecar-translate.translateSelectedText', async () => {
    const activeEditor = window.activeTextEditor
    if (!activeEditor)
      return

    let range: Range = activeEditor.selection

    // If the user has not selected any text, use the word where the cursor is located.
    if (range.start.isEqual(range.end))
      range = activeEditor.document.getWordRangeAtPosition(range.start) || range

    const meta = useTranslationMeta()

    const res = await translate({
      text: activeEditor.document.getText(range),
      from: meta.from as string as any,
      to: meta.to as string as any,
    })

    if (!res.ok) {
      window.showErrorMessage(res.message)
      return
    }

    displayOnGapLines(activeEditor, [
      {
        range,
        text: res.text,
      },
    ])
  }))
}
