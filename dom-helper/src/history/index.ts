import { Action, Location, Update, History } from 'history';
import { fdom, FDomAttributes } from 'mve-dom';
import {
  batchSignalEnd,
  createSignal,
  EmptyFun,
  getValueOrGet,
  memo,
} from 'wy-helper';
import { ReadURLSearchParam } from 'wy-dom-helper';
import { createContext } from 'mve-core';

const RouterContext = createContext<{
  router: History;
  getHistoryState(): HistoryState;
  backOrReplace(v: string): void;
  replaceAndFirstPush(v: string): void;
}>(undefined!);

export interface HistoryState {
  pathname: string;
  fromPathname?: string;
  action: Action;
  hash: string;
  location: Location;
  search: ReadURLSearchParam;
}

export function routerProvide(router: History) {
  const _historyState = createSignal<Update>(router);
  let stackLength = 0;
  router.listen(function (update) {
    if (update.action == Action.Pop) {
      stackLength--;
    }
    if (update.action == Action.Push) {
      stackLength++;
    }
    _historyState.set(update);
    batchSignalEnd();
  });

  const getHistoryState = memo<HistoryState>(e => {
    const state = _historyState.get();
    const lastLocation = e?.location;
    const location = state.location;
    let pathname = e?.pathname!;
    if (lastLocation?.pathname != location.pathname) {
      pathname = decodeURI(location.pathname);
    }
    let search = e?.search!;
    if (lastLocation?.search != location.search) {
      search = new URLSearchParams(location.search) as ReadURLSearchParam;
    }
    return {
      fromPathname: e?.pathname,
      pathname,
      location,
      action: state.action,
      hash: state.location.hash,
      search,
    };
  });
  return RouterContext.provide({
    router,
    backOrReplace(href: string) {
      if (stackLength) {
        router.back();
      } else {
        router.replace(href);
      }
    },
    replaceAndFirstPush(href: string) {
      if (stackLength) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    getHistoryState,
  });
}

export function routerConsume() {
  return RouterContext.consume();
}
export interface LocationState {
  hash: string;
  pathname: string;
  search: ReadURLSearchParam;
}

export function currentHref() {
  return location.hash.slice(1);
}

export function fLink(
  props: FDomAttributes<'a'> & {
    replace?: boolean;
  }
) {
  const { router } = routerConsume();
  const href = props.href;
  if (href) {
    return fdom.a({
      ...props,
      href: 'javascript:void(0)',
      onClick() {
        const value = getValueOrGet(href);
        if (value) {
          if (props.replace) {
            router.replace(value);
          } else {
            router.push(value);
          }
        }
      },
    });
  } else {
    return fdom.a(props);
  }
}
