import { effect } from '@vue/reactivity'
import type { StatusBarItem } from 'vscode'
import { StatusBarAlignment, window } from 'vscode'
import type { Context } from '~/context'
import { useStore } from '~/store'

let entryButton: StatusBarItem

export function registerEntryButton(ctx: Context) {
  entryButton = window.createStatusBarItem(StatusBarAlignment.Right, 0)
  // TODO: need product icons
  const store = useStore(ctx)
  effect(() => {
    entryButton.text = store.enableContinuousTranslation
      ? store.callingTranslateService
        ? '$(sync~spin) Translating'
        : '$(pass) translated'
      : '$(run-all) Translate'
    entryButton.command = 'interline-translate.showTranslatePopmenu'
    entryButton.show()
  })
}
