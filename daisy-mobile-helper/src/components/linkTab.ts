import { EmptyFun, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { getHistoryState, fLink } from "../history"
import { cns } from "wy-dom-helper"

export function linkTab({
  href,
  className,
  disabled,
  children
}: {
  href: ValueOrGet<string>,
  disabled?: ValueOrGet<any>
  className?: string
  children: EmptyFun
}) {
  const getHref = valueOrGetToGet(href)
  const getDisabled = valueOrGetToGet(disabled)
  fLink({
    href() {
      if (!getDisabled()) {
        return getHref()
      }
    },
    replace: true,
    className() {
      const active = getHistoryState().pathname.startsWith(getHref())
      return cns(
        "daisy-tab flex-1",
        className,
        active ? 'daisy-tab-active' : getDisabled() && 'daisy-tab-disabled'
      )
    },
    children
  })
}