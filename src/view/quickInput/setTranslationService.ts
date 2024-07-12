import { QuickInputButtons, commands, window } from 'vscode'
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
  let notGoingHome = false
  const moreItem = {
    label: '$(extensions) More...',
    description: 'Install more translate sources from Extensions Marketplace',
  }
  defineQuickPickItems(quickPick, translatorOptions.value.map(({ name, label }) => ({
    label: name === config.translator ? `$(check) ${label}` : `$(array) ${label}`,
    description: name,
  })).concat([moreItem]))

  quickPick.onDidChangeSelection(async (selection) => {
    const translatorName = selection[0].description

    // Search Plugin Marketplace
    if (translatorName === moreItem.description) {
      commands.executeCommand('workbench.extensions.search', '@tag:translateSource')
      notGoingHome = true
      quickPick.hide()
      return
    }

    if (!translatorName || !(translatorName in translators.value)) {
      window.showErrorMessage(`Invalid service: ${translatorName}`)
      return
    }

    window.showInformationMessage(`Selected service: ${selection[0].label.split(') ')[1]}`)
    config.translator = translatorName as ConfigKeyTypeMap['interline-translate.translator']
    quickPick.hide()
  })

  quickPick.buttons = [
    QuickInputButtons.Back,
  ]
  quickPick.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      quickPick.hide()
  })

  quickPick.onDidHide(() => {
    quickPick.dispose()
    if (!notGoingHome)
      showTranslatePopmenu(ctx)
  })
  quickPick.show()
}
