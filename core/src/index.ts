import { batchSignalEnd, EmptyFun, GetValue } from 'wy-helper';
import {
  hookAlterChildren,
  hookAlterStateHolder,
  hookCurrentStateHolder,
} from './cache';
import { StateHolder } from './stateHolder';

export * from './renderForEach';
export {
  hookAddResult,
  hookAddDestroy,
  hookAlterChildren,
  hookAlterStateHolder,
  hookCurrentStateHolder,
} from './cache';
export { createContext } from './context';
export type { Context } from './context';
export * from './hookChildren';

const globalHolder = new StateHolder();
export function runGlobalHolder<T>(fun: () => T) {
  const before = hookAlterStateHolder(globalHolder);
  const o = fun();
  hookAlterStateHolder(before);
  return o;
}

export function destroyGlobalHolder() {
  globalHolder.destroy();
}

export function render(create: EmptyFun) {
  const stateHolder = new StateHolder(globalHolder);
  const before = hookAlterStateHolder(stateHolder);
  create();
  batchSignalEnd(); // 必须放在之前
  hookAlterStateHolder(before);
  return function () {
    stateHolder.removeFromParent();
  };
}

export function hookIsDestroyed() {
  return hookCurrentStateHolder()!.destroyed;
}

export function renderStateHolder<T>(fun: GetValue<T>) {
  const c = hookCurrentStateHolder()!;
  const before = hookAlterStateHolder(new StateHolder(c, c.contexts.length));
  const o = fun();
  hookAlterStateHolder(before);
  return o;
}

// export function renderSubOps(fun: EmptyFun) {
//   const children: any[] | undefined = [];
//   const beforeChildren = hookAlterChildren(children);
//   fun();
//   hookAlterChildren(beforeChildren);
//   return function () {
//     return children;
//   };
// }
