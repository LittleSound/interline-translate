import { QuickInputButtons, window } from 'vscode'
import { showTranslatePopmenu } from './translatePopmenu'
import { showSettingsPopmenu } from './settingsPopmenu'
import { config } from '~/config'
import type { Context } from '~/context'

export function showSetKnownPopularWordInput(ctx: Context) {
  const inputBox = window.createInputBox()
  inputBox.title = 'Known Popular Words'
  inputBox.value = String(config.knownPopularWordCount || 0)

  inputBox.onDidAccept(() => {
    const count = Number(inputBox.value)
    if (Number.isNaN(count)) {
      window.showErrorMessage('Invalid number')
      return
    }
    config.knownPopularWordCount = count
    showTranslatePopmenu(ctx)
  })

  inputBox.buttons = [
    QuickInputButtons.Back,
  ]
  inputBox.onDidTriggerButton((button) => {
    if (button === QuickInputButtons.Back)
      showTranslatePopmenu(ctx)
  })

  inputBox.onDidHide(() => {
    inputBox.dispose()
    showSettingsPopmenu(ctx)
  })
  inputBox.show()
}
