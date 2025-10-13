import { fdom } from 'mve-dom';
import {
  createSignal,
  simpleEqualsNotEqual,
  YearMonthDayVirtualView,
  DAYMILLSECONDS,
  dragSnapWithList,
  getInterpolate,
  extrapolationClamp,
  memoFun,
  memo,
  extrapolationCombine,
  extrapolationExtend,
} from 'wy-helper';
import renderHeader from './renderHeader';
import renderPageList from './renderPageList';
import { topContext } from './context';
import renderScrollYear from './renderYearMonthChoose';
import { hookDestroy } from 'mve-helper';
import { OnScroll } from 'mve-dom-helper';
export function dailyRecord(arg: {
  getFullWidth(): number;
  renderHeaderRight(): void;
  didCreate(w: YearMonthDayVirtualView): void;
  renderContent(w: YearMonthDayVirtualView): void;
}) {
  const now = YearMonthDayVirtualView.fromDate(new Date());
  const today = createSignal(now, simpleEqualsNotEqual);
  const interval = setInterval(() => {
    today.set(YearMonthDayVirtualView.fromDate(new Date()));
  }, DAYMILLSECONDS / 2);
  hookDestroy(() => {
    clearInterval(interval);
  });
  const date = createSignal(now, simpleEqualsNotEqual);

  //展示日历
  function perSize() {
    return arg.getFullWidth() / 7;
  }
  function calendarOpenHeight() {
    return (5 * arg.getFullWidth()) / 7;
  }
  function scrollYearMonthOpenHeight() {
    return 44 * 3;
  }
  const topScrollY = new OnScroll('y', {
    maxScroll() {
      return calendarOpenHeight() + scrollYearMonthOpenHeight();
    },
    opposite: true,
    targetSnap: memoFun(function () {
      return dragSnapWithList([
        {
          beforeForce: 1,
          size: calendarOpenHeight(),
          afterForce: 1,
        },
        {
          beforeForce: 1,
          size: scrollYearMonthOpenHeight(),
          afterForce: 1,
        },
      ]);
    }),
  });

  topContext.provide({
    ...arg,
    perSize,
    topScrollY,
    scrollYearMonthOpenHeight,
    calendarOpenHeight,
    today: today.get,
    showCalendar() {
      return topScrollY.get() > 0;
    },
  });
  fdom.div({
    className:
      'absolute overflow-hidden inset-0 flex flex-col select-none touch-none',
    children() {
      const calendarScrollY = memoFun(() => {
        return getInterpolate(
          {
            [calendarOpenHeight()]: 0,
            [topScrollY.getMaxScroll()]: scrollYearMonthOpenHeight(),
          },
          extrapolationCombine(extrapolationClamp, extrapolationExtend)
        );
      });
      renderScrollYear(
        date,
        memo(() => {
          return calendarScrollY(topScrollY.get());
        })
      );
      renderHeader(date);
      renderPageList(date);
    },
  });
}
