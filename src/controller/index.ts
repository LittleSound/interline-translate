import { RegisterTranslator } from './immersive'
import { RegisterTranslateSelectedText } from './translateSelected'
import type { Context } from '~/context'

export function RegisterControllers(ctx: Context) {
  RegisterTranslator(ctx)
  RegisterTranslateSelectedText(ctx)
}
