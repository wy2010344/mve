import { hookTrackSignal } from 'mve-helper';
import {
  addEffect,
  emptyFun,
  GetValue,
  PointKey,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';

export type LayoutAnimateFun<T extends Element = Element> = (
  div: T,
  direction: PointKey,
  from: number
) => void;
export function setLayoutIndex<T extends HTMLElement>(
  div: T,
  getIndex: GetValue<number>,
  direction: ValueOrGet<PointKey>,
  /**
   * 将div在direction从from动画到0
   */
  animate: LayoutAnimateFun<T> = emptyFun
) {
  const getDirection = valueOrGetToGet(direction);
  let before = -1;
  hookTrackSignal(getIndex, function (index) {
    addEffect(() => {
      const direction = getDirection();
      const offsetKey = direction == 'x' ? 'offsetLeft' : 'offsetTop';
      if (before >= 0) {
        const diff = before - div[offsetKey];
        if (!diff) {
          return;
        }
        animate(div, direction, diff);
      }
      before = div[offsetKey];
    });
  });
}
