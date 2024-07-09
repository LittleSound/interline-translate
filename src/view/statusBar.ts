import { effect } from '@vue/reactivity'
import { StatusBarAlignment, window } from 'vscode'
import type { Context } from '~/context'
import { useStore } from '~/store'

export function registerEntryButton(ctx: Context) {
  const entryButton = window.createStatusBarItem(StatusBarAlignment.Right, 757)
  const settingButton = window.createStatusBarItem(StatusBarAlignment.Right, 756)
  // TODO: need product icons
  const store = useStore(ctx)

  effect(() => {
    settingButton.tooltip = 'Interline Translate Settings'
    settingButton.text = '$(settings-gear)'
    settingButton.command = 'interline-translate.showTranslatePopmenu'
    settingButton.show()
    entryButton.tooltip = 'Toggle Interline Translate'
    entryButton.text = store.enableContinuousTranslation
      ? store.callingTranslateService
        ? '$(sync~spin) Translating'
        : '$(pass) Translated'
      : '$(globe) Translate'
    entryButton.command = 'interline-translate.toggleTranslatingDocuments'
    entryButton.show()
  })
}
