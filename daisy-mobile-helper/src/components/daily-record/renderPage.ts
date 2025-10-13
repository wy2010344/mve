import { fdom, zdom } from 'mve-dom';
import {
  addEffect,
  extrapolationClamp,
  getInterpolate,
  GetValue,
  memoFun,
  YearMonthDayVirtualView,
} from 'wy-helper';
import { hookTrackSignal } from 'mve-helper';
import { topContext } from './context';
import { OnScroll } from 'mve-dom-helper';

const CREATE_SCROLLY = -50;
/**
 * 每一天的页面
 */
export default function (
  w: YearMonthDayVirtualView,
  getIndex: GetValue<number>,
  onScrollX: GetValue<any>
) {
  const { showCalendar, topScrollY, didCreate, renderContent } =
    topContext.consume();
  const scrollY: OnScroll = new OnScroll('y', {
    edgeSlow: 2,
    maxScroll() {
      return maxScroll.get();
    },
  });
  const maxScroll = scrollY.measureMaxScroll();

  hookTrackSignal(scrollY.get, function (e) {
    if (e < CREATE_SCROLLY) {
      didCreate(w);
    }
  });

  hookTrackSignal(onScrollX, function (v) {
    if (!v && getIndex() != 1) {
      //滚动出去后,归位
      addEffect(() => {
        scrollY.set(0);
      });
    }
  });
  zdom.div({
    attrs(v) {
      const i = getIndex();
      v.className = 'absolute inset-0 select-none bg-base-100 overflow-hidden';
      if (i != 1) {
        v.s_position = 'absolute';
        v.s_inset = 0;
        v.s_transform = `translateX(${(i - 1) * 100}%)`;
      }
    },
    onTouchMove(e) {
      e.preventDefault();
    },
    onPointerDown(e) {
      if (showCalendar()) {
        return topScrollY.pointerEventListner(e);
      }
      scrollY.pointerEventListner(e);
    },
    children(container: HTMLElement) {
      const interpolateIndex = memoFun(() => {
        return getInterpolate(
          {
            0: 0,
            [CREATE_SCROLLY]: texts.length - 1,
          },
          extrapolationClamp
        );
      });
      fdom.div({
        childrenType: 'text',
        className: 'absolute w-full flex justify-center',
        s_transform() {
          return `translateY(calc(${-scrollY.get()}px - 100%))`;
        },
        children() {
          const index = Math.round(interpolateIndex(scrollY.get()));
          return texts[index];
        },
      });
      //home页面
      const content = fdom.div({
        s_transform() {
          return `translateY(${-scrollY.get()}px)`;
        },
        className: 'flex flex-col',
        s_minHeight: '100%',
        children() {
          renderContent(w);
        },
      });
      maxScroll.hookInit(container, content);
    },
  });
}

const texts = [
  '新...',
  '新增...',
  '新增一...',
  '新增一条...',
  '新增一条记...',
  '新增一条记录',
];
