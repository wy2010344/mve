import { createContext } from 'mve-core';
import { OnScroll } from 'mve-dom-helper';
import { YearMonthDayVirtualView } from 'wy-helper';

export const topContext = createContext<{
  perSize(): number;
  today(): YearMonthDayVirtualView;
  topScrollY: OnScroll;
  scrollYearMonthOpenHeight(): number;
  showCalendar(): boolean;
  calendarOpenHeight(): number;
  renderHeaderRight(): void;
  didCreate(w: YearMonthDayVirtualView): void;
  renderContent(w: YearMonthDayVirtualView): void;
}>(undefined as any);
