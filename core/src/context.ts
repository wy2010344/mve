import { hookCurrentStateHolder } from './cache';

export interface Context<T> {
  provide(v: T): T;
  consume(): T;
}

export class ContextI<T> implements Context<T> {
  constructor(readonly value: T) {}
  provide(v: T): T {
    hookCurrentStateHolder(true).provide(this, v);
    return v;
  }

  consume(): T {
    const stateHolder = hookCurrentStateHolder();
    // StateHolder 的 consume 找不到 provider 时会返回默认值,
    // 不能再用 ?? 兜底:null/0/false/undefined 都是合法的 provide 值
    return stateHolder ? stateHolder.consume(this) : this.value;
  }
}

export const parentContext = new ContextI<unknown>(undefined);

export function createContext<T>(v: T): Context<T> {
  return new ContextI<T>(v);
}
