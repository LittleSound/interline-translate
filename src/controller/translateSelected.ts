import type { Range } from 'vscode'
import { commands, window } from 'vscode'
import * as meta from '../generated-meta'
import type { Context } from '~/context'
import { useExtensionContext } from '~/dependence'
import { useTranslationMeta } from '~/model/translator'
import { translate } from '~/providers/tranlations/google'
import { displayOnGapLines } from '~/view'
import { config } from '~/config'
import { translators } from '~/providers/tranlations'

export function RegisterTranslateSelectedText(ctx: Context) {
  const extCtx = useExtensionContext(ctx)

  // Translate selected text
  extCtx.subscriptions.push(commands.registerCommand(meta.commands.translateSelectedText, async () => {
    const activeEditor = window.activeTextEditor
    if (!activeEditor)
      return

    let range: Range = activeEditor.selection

    // If the user has not selected any text, use the word where the cursor is located.
    if (range.start.isEqual(range.end))
      range = activeEditor.document.getWordRangeAtPosition(range.start) || range

    const meta = useTranslationMeta()

    const translator = translators[config.translator]
    const res = await translate({
      text: activeEditor.document.getText(range),
      from: meta.from as keyof typeof translator.supportLanguage,
      to: meta.to as keyof typeof translator.supportLanguage,
    })

    if (!res.ok) {
      console.error(res, res.originalError)
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
