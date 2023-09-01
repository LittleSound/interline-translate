import type { StatusBarItem } from 'vscode'
import { StatusBarAlignment, window } from 'vscode'

let entryButton: StatusBarItem

export function registerEntryButton() {
  entryButton = window.createStatusBarItem(StatusBarAlignment.Right, 0)
  // TODO: need product icons
  entryButton.text = '$(run-all) Translate'
  entryButton.command = 'sidecar-translate.showTranslatePopmenu'
  entryButton.show()
}
