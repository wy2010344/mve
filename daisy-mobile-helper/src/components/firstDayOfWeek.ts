import { fdom } from 'mve-dom';
import { createSignal, DAYMILLSECONDS } from 'wy-helper';

export const WEEKTIMES = 7 * DAYMILLSECONDS;
export const WEEKS = ['一', '二', '三', '四', '五', '六', '日'];
export const firstDayOfWeekIndex = createSignal(7);
export function chooseFirstDayOfWeek() {
  fdom.div({
    className: 'daisy-dropdown daisy-dropdown-end',
    children() {
      fdom.div({
        tabIndex: 0,
        role: 'button',
        className: 'daisy-btn m-1',
        childrenType: 'text',
        children() {
          return `日历开始于:${WEEKS[firstDayOfWeekIndex.get() - 1]}`;
        },
      });
      fdom.ul({
        tabIndex: 0,
        className:
          'daisy-dropdown-content daisy-menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm',
        children() {
          for (let i = 0; i < 7; i++) {
            fdom.li({
              children() {
                fdom.button({
                  className: 'justify-end',
                  childrenType: 'text',
                  children: WEEKS[i],
                  onClick() {
                    firstDayOfWeekIndex.set(i + 1);
                    console.log('firstWeek', firstDayOfWeekIndex.get());
                  },
                });
              },
            });
          }
        },
      });
    },
  });
}
