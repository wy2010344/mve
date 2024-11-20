import { hookCurrentStateHolder } from "./cache"
import { StateHolder } from "./stateHolder"


export interface Context<T> {
  provide(v: T): void
  consume(): T
}


export function createContext<T>(v: T): Context<T> {
  return new ContextFactory(v)
}

class ContextFactory<T> implements Context<T> {
  constructor(
    public readonly defaultValue: T
  ) { }

  provide(v: T): void {
    const holder = hookCurrentStateHolder()!
    holder.contexts.push({
      key: this,
      value: v
    })
  }
  consume(): T {
    const holder = hookCurrentStateHolder()!
    const provider = this.findProviderStateHoder(holder)
    if (provider) {
      return provider.value
    }
    return this.defaultValue
  }

  private findProviderStateHoder(holder: StateHolder) {
    let begin = holder.contexts.length
    while (holder) {
      const providers = holder.contexts
      for (let i = begin - 1; i > -1; i--) {
        const provider = providers[i]
        if (provider.key == this) {
          return provider
        }
      }
      begin = holder.parentContextIndex
      holder = holder.parent!
    }
  }
}