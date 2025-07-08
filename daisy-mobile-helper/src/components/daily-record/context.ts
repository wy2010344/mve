import { createContext } from "mve-core";
import { OnScroll } from "mve-dom-helper";
import { AnimateSignal, YearMonthDayVirtualView } from "wy-helper";

export const topContext = createContext<{
  today(): YearMonthDayVirtualView
  yearMonthScrollY: OnScroll,
  scrollYearMonthOpenHeight(): number
  calendarScrollY: OnScroll
  showYearMonth(): boolean
  showCalendar(): boolean
  calendarOpenHeight(): number
  calendarClose(): void
  renderHeaderRight(): void
  renderContent(w: YearMonthDayVirtualView): void
}>(undefined as any)