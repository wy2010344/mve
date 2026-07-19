import { hookCurrentStateHolder } from './cache';

export interface Context<T> {
  provide(v: T): T;
  consume(): T;
}

export class ContextI<T> implements Context<T> {
  constructor(readonly value: T) {}
  provide(v: T): T {
    const stateHolder = hookCurrentStateHolder();
    stateHolder?.provide(this, v);
    return v;
  }

  consume(): T {
    const stateHolder = hookCurrentStateHolder();
    return stateHolder?.consume(this) ?? this.value;
  }
}

export const parentContext = new ContextI<unknown>(undefined);

export function createContext<T>(v: T): Context<T> {
  return new ContextI<T>(v);
}
