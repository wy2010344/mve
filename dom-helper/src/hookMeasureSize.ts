import { hookCurrentStateHolder } from 'mve-core';
import { addEffect, batchSignalEnd, createSignal } from 'wy-helper';

export function hookMeasureSize() {
  const width = createSignal(0);
  const height = createSignal(0);
  const stateHolder = hookCurrentStateHolder(true);
  let inited = false;
  return {
    width: width.get,
    height: height.get,
    plugin(target: HTMLElement) {
      if (inited) {
        throw new Error('can not init again');
      }
      inited = true;
      addEffect(() => {
        const cb = (e?: any) => {
          width.set(target.offsetWidth);
          height.set(target.offsetHeight);
          if (e) {
            batchSignalEnd();
          }
        };
        cb();
        const ob = new ResizeObserver(cb);
        ob.observe(target);
        stateHolder.addDestroy(() => {
          ob.disconnect();
        });
      }, -2);
      return target;
    },
  };
}
