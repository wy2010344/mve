import { Action, Location, createHashHistory, Update } from "history";
import { fdom, FDomAttributes } from "mve-dom";
import { batchSignalEnd, createSignal, getValueOrGet, memo } from "wy-helper";
import { ReadURLSearchParam } from 'wy-dom-helper'

export const history = createHashHistory()
const _historyState = createSignal<Update>(history)
history.listen(function (update) {
  _historyState.set(update)
  batchSignalEnd()
})

export function currentHref() {
  return location.hash.slice(1)
}

export const getHistoryState = memo<{
  pathname: string
  beforePathname?: string
  action: Action
  hash: string
  location: Location
  search: ReadURLSearchParam
}>((e) => {
  const state = _historyState.get()
  let lastLocation = e?.location
  const location = state.location
  let pathname = e?.pathname!
  if (lastLocation?.pathname != location.pathname) {
    pathname = decodeURI(location.pathname)
  }
  let search = e?.search!
  if (lastLocation?.search != location.search) {
    search = new URLSearchParams(location.search) as ReadURLSearchParam
  }
  return {
    beforePathname: e?.pathname,
    pathname,
    location,
    action: state.action,
    hash: state.location.hash,
    search
  }
})

export function linkClick(href: string) {
  const value = getValueOrGet(href)
  if (value) {
    history.push(value)
  }
}
export function fLink(props: FDomAttributes<"a"> & {
  replace?: boolean
}) {
  const href = props.href
  if (href) {
    fdom.a({
      ...props,
      href: 'javascript:void(0)',
      onClick() {
        const value = getValueOrGet(href)
        if (value) {
          if (props.replace) {
            history.replace(value)
          } else {

            history.push(value)
          }
        }
      }
    })
  } else {
    fdom.a(props)
  }
}