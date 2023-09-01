import type { QuickPick, QuickPickItem } from 'vscode'
import { QuickInputButtons, QuickPickItemKind, commands, window } from 'vscode'
import type { Fn } from '~/types'

export function showTranslatePopmenu() {
  const quickPick = window.createQuickPick()
  quickPick.title = 'Interline Translate'
  defineQuickPickItems(quickPick, [
    {
      alwaysShow: true,
      picked: true,
      label: '$(run-all) Translate',
      detail: 'Start translating documents',
      callback: () => commands.executeCommand('sidecar-translate.startTranslatingDocuments'),
    },
    {
      label: 'Options',
      kind: QuickPickItemKind.Separator,
    },
    {
      label: '$(globe) Target:',
      description: 'Chinese (Simplified)',
      callback: () => showSetLanguagePopmenu('target'),
    },
    {
      label: '$(file-code) Source:',
      description: 'English',
      callback: () => showSetLanguagePopmenu('source'),
    },
    {
      label: '$(cloud) Service:',
      description: 'Google Translate',
      callback: () => showSetTranslationService(),
    },
  ])
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

  quickPick.onDidChangeSelection((selection) => {
    const label = selection[0].label
    const callback = map.get(label)
    if (callback)
      callback()
  })
}
