import { QuickInputButtons, window } from 'vscode'
import { defineQuickPickItems } from './utils'
import { showTranslatePopmenu } from './translatePopmenu'
import { config } from '~/config'
import type { Context } from '~/context'
import { translatorOptions, translators } from '~/providers/tranlations'
import type { ConfigKeyTypeMap } from '~/generated-meta'

export function showSetTranslationService(ctx: Context) {
  const quickPick = window.createQuickPick()
  quickPick.title = 'Translation Service'
  quickPick.matchOnDescription = true
  quickPick.matchOnDetail = true
  defineQuickPickItems(quickPick, translatorOptions.map(({ name, label }) => ({
    label: name === config.translator ? `$(check) ${label}` : `$(array) ${label}`,
    description: name,
  })))

  quickPick.onDidChangeSelection((selection) => {
    window.showInformationMessage(`Selected service: ${selection[0].label}`)
    const translatorName = selection[0].description
    if (!translatorName || !(translatorName in translators)) {
      window.showErrorMessage('Invalid service')
      return
    }
    config.translator = translatorName as ConfigKeyTypeMap['interline-translate.translator']
    showTranslatePopmenu(ctx)
  })

  quickPick.buttons = [
    QuickInputButtons.Back,
  ]
  quickPick.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      showTranslatePopmenu(ctx)
  })

  quickPick.onDidHide(() => {
    quickPick.dispose()
    showTranslatePopmenu(ctx)
  })
  quickPick.show()
}
