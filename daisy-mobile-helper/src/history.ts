import { Action, Location, Update, History } from "history";
import { fdom, FDomAttributes } from "mve-dom";
import { batchSignalEnd, createSignal, EmptyFun, getValueOrGet, memo, } from "wy-helper";
import { ReadURLSearchParam } from 'wy-dom-helper'
import { createContext } from 'mve-core'

const RouterContext = createContext<{
  router: History
  getHistoryState(): HistoryState
}>(undefined!)

export interface HistoryState {
  pathname: string
  fromPathname?: string
  action: Action
  hash: string
  location: Location
  search: ReadURLSearchParam
}

export function routerProvide(router: History) {
  const _historyState = createSignal<Update>(router)
  router.listen(function (update) {
    _historyState.set(update)
    batchSignalEnd()
  })
  return RouterContext.provide({
    router,
    getHistoryState: memo<HistoryState>((e) => {
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
        fromPathname: e?.pathname,
        pathname,
        location,
        action: state.action,
        hash: state.location.hash,
        search
      }
    })
  })
}

export function routerConsume() {
  return RouterContext.consume()
}
export interface LocationState {
  hash: string
  pathname: string
  search: ReadURLSearchParam
}


export function currentHref() {
  return location.hash.slice(1)
}

export function fLink(props: FDomAttributes<"a"> & {
  replace?: boolean
}) {
  const { router } = routerConsume()
  const href = props.href
  if (href) {
    return fdom.a({
      ...props,
      href: 'javascript:void(0)',
      onClick() {
        const value = getValueOrGet(href)
        if (value) {
          if (props.replace) {
            router.replace(value)
          } else {
            router.push(value)
          }
        }
      }
    })
  } else {
    return fdom.a(props)
  }
}