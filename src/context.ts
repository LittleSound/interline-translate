export interface Context {
  put<T>(key: (...p: any[]) => T, dep: T): void
  lazyPut<T>(ctx: (...p: any[]) => T, p: (ctx: Context) => T): void
  find<T>(key: (p: T) => T): T
  _map: Map<any, any>
}

export type UseDependency<T> = ((ctx: Context) => T) & {
  provide(ctx: Context, dep: T): UseDependency<T>
  lazyProvide(ctx: Context, provider: (ctx: Context) => T): UseDependency<T>
}

export function createContext(proto?: Context) {
  const _map = new Map<any, { dep: unknown; provider?: (ctx: Context) => unknown }>(proto?._map)

  const context = { put, lazyPut, find, _map }

  function put<T>(key: (...p: any[]) => any, dep: T) {
    _map.set(key, { dep })
  }

  function lazyPut<T>(dep: (...p: any[]) => T, p: (ctx: Context) => T) {
    _map.set(dep, { dep: undefined, provider: p })
  }

  function find<T>(key: (p: T) => T): T {
    const item = _map.get(key)
    if (item?.dep === undefined && item?.provider)
      item.dep = item.provider(context)

    return item?.dep as any
  }

  return context
}

export function defineDependency<T>(debugLabel: string = 'Unknown'): UseDependency<T> {
  const useDependency: UseDependency<T> = (ctx: Context) => {
    const dependency = ctx.find(useDependency as any) as any
    if (dependency === undefined)
      throw new Error(`Dependency not found: ${debugLabel}`)
    return dependency
  }
  const provide = (ctx: Context, dep: T) => {
    ctx.put(useDependency, dep)
    return useDependency
  }

  const lazyProvide = (ctx: Context, p: (ctx: Context) => T) => {
    ctx.lazyPut(useDependency, p)
    return useDependency
  }

  useDependency.provide = provide
  useDependency.lazyProvide = lazyProvide
  return useDependency
}
