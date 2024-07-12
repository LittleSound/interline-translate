import { QuickInputButtons, commands, window } from 'vscode'
import { defineQuickPickItems } from './utils'
import { showTranslatePopmenu } from './translatePopmenu'
import { showSetKnownPopularWordInput } from './setKnownPopularWordInput'
import { showClearTranslationCachePopconfirm } from './clearTranslationCachePopconfirm'
import type { Context } from '~/context'
import { translationCacheMap } from '~/model/cache'
import { config } from '~/config'
import * as extMeta from '~/generated-meta'

export function showSettingsPopmenu(ctx: Context) {
  const quickPick = window.createQuickPick()
  quickPick.title = 'Interline Translate'
  let routeJumping = false
  quickPick.onDidChangeSelection(() => routeJumping = true)
  const numberOfPhrases = Array.from(translationCacheMap.values()).reduce((acc, cache) => acc + cache.size, 0)
  defineQuickPickItems(quickPick, [
    {
      label: '$(mortar-board) Known popular words',
      detail: `${config.knownPopularWordCount} words`,
      callback: () => showSetKnownPopularWordInput(ctx),
    },
    {
      label: '$(database) Clear translation cache',
      detail: `${numberOfPhrases} phrases`,
      callback: () => showClearTranslationCachePopconfirm(ctx),
    },
    {
      label: '$(gear) More settings',
      detail: 'Configure extension settings',
      callback: () => commands.executeCommand('workbench.action.openSettings', extMeta.name).then(() => quickPick.dispose()),
    },
  ])

  quickPick.buttons = [QuickInputButtons.Back]
  quickPick.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      quickPick.hide()
  })

  quickPick.onDidHide(() => {
    if (!routeJumping)
      showTranslatePopmenu(ctx)
  })
  quickPick.show()
}
