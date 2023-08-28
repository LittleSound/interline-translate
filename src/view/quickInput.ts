import { QuickInputButtons, QuickPickItemKind, commands, window } from 'vscode'

export function showTranslatePopmenu() {
  const quickPick = window.createQuickPick()
  quickPick.title = 'Interline Translate'
  quickPick.items = [
    {
      alwaysShow: true,
      picked: true,
      label: '$(run-all) Translate',
      detail: 'Start translating documents',
    },
    {
      label: 'Options',
      kind: QuickPickItemKind.Separator,
    },
    {
      label: '$(globe) Target:',
      description: 'Chinese (Simplified)',
    },
    {
      label: '$(file-code) Source:',
      description: 'English',
    },
    {
      label: '$(cloud) Service:',
      description: 'Google Translate',
    },
  ]
  quickPick.onDidChangeSelection((selection) => {
    const label = selection[0].label

    switch (label) {
      case quickPick.items[0].label:
        commands.executeCommand('sidecar-translate.startTranslatingDocuments')
        quickPick.hide()
        break
      case quickPick.items[2].label:
        showSetLanguagePopmenu('target')
        break
      case quickPick.items[3].label:
        showSetLanguagePopmenu('source')
        break
      case quickPick.items[4].label:
        showSetTranslationService()
        break
    }
  })
  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}

export function showSetLanguagePopmenu(type: 'target' | 'source') {
  const quickPick = window.createQuickPick()
  quickPick.title = type === 'target'
    ? 'Target Language'
    : 'Source Language'

  quickPick.items = [
    {
      label: 'Chinese (Simplified)',
      description: 'zh-CN',
    },
    {
      label: 'Chinese (Traditional)',
      description: 'zh-TW',
    },
    {
      label: 'English',
      description: 'en',
    },
    {
      label: 'Japanese',
      description: 'ja',
    },
    {
      label: 'Korean',
      description: 'ko',
    },
  ]

  quickPick.onDidChangeSelection((selection) => {
    window.showInformationMessage(`Selected language: ${selection[0].label}`)
    showTranslatePopmenu()
  })

  quickPick.buttons = [
    QuickInputButtons.Back,
  ]
  quickPick.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      showTranslatePopmenu()
  })

  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}

export function showSetTranslationService() {
  const quickPick = window.createQuickPick()
  quickPick.title = 'Translation Service'
  quickPick.items = [
    {
      label: 'Google Translate',
      description: 'Powered by Google Translate',
    },
    {
      label: 'Baidu Translate',
      description: 'Powered by Baidu Translate',
    },
    {
      label: 'Youdao Translate',
      description: 'Powered by Youdao Translate',
    },
    {
      label: 'More...',
      description: 'Install more translate sources from Extensions Marketplace',
    },
  ]

  quickPick.onDidChangeSelection((selection) => {
    window.showInformationMessage(`Selected service: ${selection[0].label}`)
    showTranslatePopmenu()
  })

  quickPick.buttons = [
    QuickInputButtons.Back,
  ]
  quickPick.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      showTranslatePopmenu()
  })

  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}
