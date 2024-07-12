import { QuickPickItemKind, commands, window } from 'vscode'
import { defineQuickPickItems } from './utils'
import { showSetLanguagePopmenu } from './setLanguagePopmenu'
import { showSetTranslationService } from './setTranslationService'
import { showSettingsPopmenu } from './settingsPopmenu'
import { config, languageOptions } from '~/config'
import type { Context } from '~/context'
import { useStore } from '~/store'
import { translators } from '~/providers/tranlations'

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
      description: translators.value[config.translator]?.label || `Unsupported: ${config.translator}`,
      callback: () => showSetTranslationService(ctx),
    },
    {
      label: '$(gear) Settings',
      description: 'Configure extension settings',
      callback: () => showSettingsPopmenu(ctx),
    },
  ])
  quickPick.onDidHide(() => quickPick.dispose())
  quickPick.show()
}
