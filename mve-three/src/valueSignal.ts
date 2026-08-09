import { createSignal, initRWValue } from 'wy-helper';

/**
 * 支持 .value 读写属性的信号,方便lil-gui等库直接绑定
 */
export function valueSignal<T>(v: T) {
  const n = createSignal(v);
  return initRWValue(n.get, n.set);
}
