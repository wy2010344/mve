import {
  AbortPromiseResult,
  AutoLoadMoreCore,
  batchSignalEnd,
  Compare,
  createLateSignal,
  createSignal,
  emptyArray,
  emptyObject,
  FalseType,
  GetValue,
  OneSetStoreRef,
  PromiseResult,
  Quote,
  signalSerialAbortPromise,
  signalSerialAbortPromiseLoadMore,
  StoreRef,
} from 'wy-helper';
import { hookDestroy } from './hookTrackSignal';

export function hookPromiseSignal<T>(
  getPromise: GetValue<GetValue<Promise<T>> | FalseType>,
  signal?: OneSetStoreRef<AbortPromiseResult<T> | undefined>
) {
  const { destroy, ...args } = signalSerialAbortPromise(getPromise, signal);
  hookDestroy(destroy);
  return args;
}

export function hookPromiseSignalLoadMore<T, K, M = {}>(
  getPromise: GetValue<
    | {
        getAfter(k: K): Promise<AutoLoadMoreCore<T, K> & M>;
        first: K;
      }
    | FalseType
  >,
  arg?: {
    equals?: Compare<T>;
    signal?: OneSetStoreRef<
      AbortPromiseResult<AutoLoadMoreCore<T, K> & M> | undefined
    >;
  }
) {
  const { destroy, ...args } = signalSerialAbortPromiseLoadMore(
    getPromise,
    arg
  );
  hookDestroy(destroy);
  return args;
}

export function promiseSignal<T>(
  promise: Promise<T>,
  {
    flush,
    signal = createLateSignal<PromiseResult<T> | undefined>(undefined),
  }: {
    flush?: boolean;
    signal?: OneSetStoreRef<PromiseResult<T> | undefined>;
  } = emptyObject
) {
  const setSignal = signal.getOnlySet();
  promise
    .then(value => {
      setSignal({
        type: 'success',
        promise,
        value,
      });
      if (flush) {
        batchSignalEnd();
      }
    })
    .catch(err => {
      setSignal({
        type: 'error',
        promise,
        value: err,
      });
      if (flush) {
        batchSignalEnd();
      }
    });

  return {
    get: signal.get,
    reduceSet(n: Quote<T>) {
      const o = signal.get();
      if (o?.type == 'success') {
        setSignal({
          ...o,
          value: n(o.value),
        });
        return true;
      }
      return false;
    },
  };
}
