import { QuickInputButtons, window } from 'vscode'
import { showTranslatePopmenu } from './translatePopmenu'
import { config, languageOptions } from '~/config'
import type { Context } from '~/context'
import { translators } from '~/providers/tranlations'

export function showSetLanguagePopmenu(ctx: Context, type: 'target' | 'source') {
  const quickPick = window.createQuickPick()
  quickPick.matchOnDescription = true

  quickPick.title = type === 'target'
    ? 'Target Language'
    : 'Source Language'

  const currentLang = type === 'target'
    ? config.defaultTargetLanguage
    : 'en'

  const translatorName = config.translator || 'google'
  quickPick.items = languageOptions
    .filter(item => type === 'target'
      ? translators[translatorName].supportLanguage[item.description!]
      : item.description === 'en',
    )
    .map((item) => {
      const isCurrent = item.description === currentLang
      return {
        ...item,
        label: `${isCurrent ? '$(check) ' : '$(array) '}${item.label}`,
      }
    })

  quickPick.onDidChangeSelection((selection) => {
    window.showInformationMessage(`Selected ${type} language: ${selection[0].label.split(') ')[1]}`)
    const selectedLanguage = selection[0].description
    if (!selectedLanguage) {
      window.showErrorMessage('Invalid language')
      return
    }

    if (type === 'target') {
      config.defaultTargetLanguage = selectedLanguage
    }
    else {
      // @TODO: set source language
      window.showErrorMessage('Not implemented')
    }

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
