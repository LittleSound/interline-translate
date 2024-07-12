import type { QuickPick, QuickPickItem } from 'vscode'
import type { Fn } from '~/types'

export function defineQuickPickItems<I extends QuickPickItem, Q extends QuickPick<QuickPickItem>>(quickPick: Q, items: (I & { callback?: Fn })[]) {
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
