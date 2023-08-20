import { RegisterTranslator } from './immersive'
import type { Context } from '~/context'

export function RegisterControllers(ctx: Context) {
  RegisterTranslator(ctx)
}
