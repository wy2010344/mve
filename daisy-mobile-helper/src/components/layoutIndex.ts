import { animate, AnimationOptions } from 'motion';
import { hookTrackSignal } from 'mve-helper';
import {
  addEffect,
  GetValue,
  PointKey,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';

export function setLayoutIndex(
  div: HTMLElement,
  getIndex: GetValue<number>,
  direction: ValueOrGet<PointKey>,
  config?: AnimationOptions
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
        animate(
          div,
          {
            [direction]: [diff, 0],
          },
          config
        );
      }
      before = div[offsetKey];
    });
  });
}
