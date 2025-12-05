import { hookDestroy, hookTrackSignal } from 'mve-helper';
import { moveEdgeScroll, subscribeEventListener } from 'wy-dom-helper';
import {
  EdgeScrollConfig,
  GetValue,
  PagePoint,
  PointKey,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';

/**
 * 不是太好，应该是拖拽触发，而不是观察状态
 * 不对，不只与当前容器有关，其实与所有容器都有关
 * @param container
 * @param param1
 */
export function setEdgeScroll(
  container: HTMLElement,
  {
    getPoint,
    shouldMeasure,
    direction,
    getSpeed,
    config,
  }: {
    getPoint?(n: PointerEvent, dir: PointKey): number;
    shouldMeasure: GetValue<any>;
    direction: ValueOrGet<PointKey>;
    getSpeed?(n: number): number;
    config?: EdgeScrollConfig;
  }
) {
  let mes: ReturnType<typeof moveEdgeScroll> | undefined = undefined;
  const getDirection = valueOrGetToGet(direction);
  hookTrackSignal(shouldMeasure, function (bool) {
    if (bool) {
      const destroy = subscribeEventListener(
        window,
        'pointermove',
        function (e) {
          if (mes) {
            mes.changePoint(e);
          } else {
            mes = moveEdgeScroll(container, {
              point: e,
              config,
              getPoint,
              direction: getDirection,
              getSpeed,
            });
          }
        }
      );
      return function () {
        destroy();
        mes?.destroy();
        mes = undefined;
      };
    }
  });
}

export function setEdgeScrollPoint<T extends PagePoint>(
  container: HTMLElement,
  {
    getPoint,
    movePoint,
    direction,
    getSpeed,
    config,
  }: {
    getPoint?(n: T, dir: PointKey): number;
    movePoint: GetValue<T | void>;
    direction: ValueOrGet<PointKey>;
    getSpeed?(n: number): number;
    config?: EdgeScrollConfig;
  }
) {
  let mes: ReturnType<typeof moveEdgeScroll> | undefined = undefined;
  const getDirection = valueOrGetToGet(direction);
  hookDestroy(() => {
    mes?.destroy();
    mes = undefined;
  });
  hookTrackSignal(movePoint, function (e) {
    if (e) {
      if (mes) {
        mes.changePoint(e);
      } else {
        mes = moveEdgeScroll(container, {
          point: e,
          config,
          getPoint,
          direction: getDirection,
          getSpeed,
        });
      }
    } else {
      mes?.destroy();
      mes = undefined;
    }
  });
}
