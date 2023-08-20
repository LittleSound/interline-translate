import type { Fn } from '~/types'

export const invoke: <F extends Fn>(fn: F) => ReturnType<F> = fn => fn()
