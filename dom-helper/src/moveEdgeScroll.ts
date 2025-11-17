import { hookTrackSignal } from 'mve-helper';
import { moveEdgeScroll, subscribeEventListener } from 'wy-dom-helper';
import {
  EdgeScrollConfig,
  GetValue,
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
    shouldMeasure,
    direction,
    getSpeed,
    config,
  }: {
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
