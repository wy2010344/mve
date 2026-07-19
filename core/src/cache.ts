import { EmptyFun, getGlobalThis } from 'wy-helper';
import { StateHolder } from './state-holder';
const mve_global_key = 'mve_global_key';
const gt = getGlobalThis() as any;

const mveGlobal = (gt[mve_global_key] || {}) as {
  stateHolder?: StateHolder<any>;
};

export function hookAlterStateHolder(stateHolder?: StateHolder<any>) {
  const before = mveGlobal.stateHolder;
  mveGlobal.stateHolder = stateHolder;
  return before;
}

export function hookCurrentStateHolder(orThrow: true): StateHolder<any>;
export function hookCurrentStateHolder(
  orThrow?: boolean
): StateHolder<any> | void;
export function hookCurrentStateHolder(orThrow?: boolean) {
  const s = mveGlobal.stateHolder;
  if (!s && orThrow) {
    throw new Error('需要在StateHolder里执行');
  }
  return s;
}
