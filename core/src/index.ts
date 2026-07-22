import { emptyObject, GetValue } from 'wy-helper';
import { Creater, RenderForEachArg } from './state-holder';
import { hookCurrentStateHolder } from './cache';
import { EachTime } from './each-value';
export type { EachTime, RenderForEachArg };

export type { Context } from './context';
export { purifyList } from './value-or-get-list';
export type { ValueOrGetList } from './value-or-get-list';
export { createContext } from './context';
export { renderSetRoot, renderListRoot } from './target-state-holder';
export * from './hook-children';
export { hookCurrentStateHolder } from './cache';
export type { StateHolder, StateHolderWithNode } from './state-holder';

export function renderForEach<T, K = T, O = void>(
  forEach: (callback: (key: K, value: T) => GetValue<O>) => void,
  creater: Creater<any, T, K, O>,
  arg: RenderForEachArg<K> = emptyObject
) {
  return hookCurrentStateHolder(true).renderForEach(forEach, creater, arg);
}

export function hookAddResult(o: any) {
  return hookCurrentStateHolder(true).addNode(o);
}
