import type { QuickPick, QuickPickItem } from 'vscode'
import { QuickInputButtons, QuickPickItemKind, commands, window } from 'vscode'
import { config, languageOptions } from '~/config'
import type { Context } from '~/context'
import { useStore } from '~/store'
import type { Fn } from '~/types'
import { translatorOptions, translators } from '~/providers/tranlations'
import type { ConfigKeyTypeMap } from '~/generated-meta'

export function showTranslatePopmenu(ctx: Context) {
  const store = useStore(ctx)

  const quickPick = window.createQuickPick()
  quickPick.title = 'Interline Translate'
  defineQuickPickItems(quickPick, [
    store.enableContinuousTranslation || store.enableContinuousTranslationOnce
      ? { // Stop
          alwaysShow: true,
          picked: true,
          label: '$(stop-circle) Stop',
          detail: 'Stop translating documents',
          callback: () => commands.executeCommand('interline-translate.stopTranslatingDocuments').then(() => quickPick.dispose()),
        }
      : { // Start
          alwaysShow: true,
          picked: true,
          label: '$(run-all) Translate',
          detail: 'Start translating documents',
          callback: () => commands.executeCommand('interline-translate.startTranslatingDocuments').then(() => quickPick.dispose()),
        },
    {
      label: 'Options',
      kind: QuickPickItemKind.Separator,
    },
    {
      label: '$(globe) Target:',
      description: languageOptions.find(item => item.description === config.defaultTargetLanguage)?.label,
      callback: () => showSetLanguagePopmenu(ctx, 'target'),
    },
    {
      label: '$(file-code) Source:',
      description: 'English',
      callback: () => showSetLanguagePopmenu(ctx, 'source'),
    },
    {
      label: '$(cloud) Service:',
      description: translators[config.translator]?.label || `Unsupported: ${config.translator}`,
      callback: () => showSetTranslationService(ctx),
    },
  ])
  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}

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

  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}

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

  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}

function defineQuickPickItems<I extends QuickPickItem, Q extends QuickPick<QuickPickItem>>(quickPick: Q, items: (I & { callback?: Fn })[]) {
  const map = new Map<string, Fn>()
  const _items: QuickPickItem[] = []
  for (const index in items) {
    const item = items[index]
    const { callback, ...others } = item
    if (callback)
      map.set(item.label, callback)
    _items[index] = others
  }

  quickPick.items = _items

  if (map.size) {
    quickPick.onDidChangeSelection((selection) => {
      const label = selection[0].label
      const callback = map.get(label)
      if (callback)
        callback()
    })
  }
}
