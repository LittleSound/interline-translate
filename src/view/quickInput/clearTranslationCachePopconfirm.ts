import { QuickInputButtons, commands, window } from 'vscode'
import { defineQuickPickItems } from './utils'
import { showTranslatePopmenu } from './translatePopmenu'
import { showSettingsPopmenu } from './settingsPopmenu'
import * as meta from '~/generated-meta'
import type { Context } from '~/context'

export function showClearTranslationCachePopconfirm(ctx: Context) {
  const quickPick = window.createQuickPick()
  quickPick.title = 'Are you sure to clear translation cache?'
  quickPick.matchOnDescription = true
  quickPick.matchOnDetail = true
  defineQuickPickItems(quickPick, [
    {
      label: '$(x) No',
      detail: 'Cancel',
      callback: () => showSettingsPopmenu(ctx),
    },
    {
      label: '$(check) Yes',
      detail: 'Clear translation cache',
      callback: () => commands.executeCommand(meta.commands.clearTranslationCache).then(() => showTranslatePopmenu(ctx)),
    },
  ])

  quickPick.buttons = [
    QuickInputButtons.Back,
  ]
  quickPick.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      showSettingsPopmenu(ctx)
  })

  quickPick.onDidHide(() => {
    quickPick.dispose()
    showSettingsPopmenu(ctx)
  })
  quickPick.show()
}
