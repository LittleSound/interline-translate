export interface Context {
  put<T>(dep: (...p: any[]) => T, p: T): void
  find<T>(dep: (p: T) => T): T
  _map: Map<any, any>
}

export type UseDependency<T> = ((ctx: Context) => T) & {
  provide(ctx: Context, p: T): UseDependency<T>
}

export function createContext(proto?: Context) {
  const ctx = new Map(proto?._map)

  function put<T>(dep: (...p: any[]) => T, p: T) {
    ctx.set(dep, p)
  }

  function find<T>(dep: (p: T) => T): T {
    return ctx.get(dep)
  }

  return { put, find, _map: ctx }
}

export function defineDependency<T>(name: string = 'Unknown') {
  const useDependency: UseDependency<T> = (ctx: Context) => {
    const dependency = ctx.find(useDependency as any) as any
    if (dependency === undefined)
      throw new Error(`Dependency not found: ${name}`)
    return dependency
  }
  const provide = (ctx: Context, p: T) => {
    ctx.put(useDependency, p)
    return useDependency
  }

  useDependency.provide = provide
  return useDependency
}
