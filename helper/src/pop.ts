import {
  circleFormat,
  createSignal,
  emptyArray,
  emptyFun,
  GetValue,
  removeEqual,
  SetValue,
  StoreRef,
} from 'wy-helper';
import { renderArray } from './renderMap';

class PopFun<T, M = T> {
  constructor(
    readonly render: SetValue<SetValue<M>>,
    private readonly onClose: SetValue<T>,
    private readonly popList: StoreRef<PopFun<any>[]>
  ) {}
  close = (value: T) => {
    this.onClose(value);
    this.popList.set(this.popList.get().filter(x => x != this));
  };
}

function renderPopFun(pop: PopFun<any>) {
  return pop.render(pop.close);
}
export function createPopList() {
  const popList = createSignal<PopFun<any>[]>(emptyArray as any);
  function createPop<T = any>(
    callback: SetValue<SetValue<T>>,
    onClose: SetValue<T> = emptyFun
  ) {
    const popFun = new PopFun(callback, onClose, popList);
    popList.set(popList.get().concat(popFun));
    return popFun.close;
  }
  function renderPop() {
    renderArray(popList.get, renderPopFun);
  }

  return {
    renderPop,
    createPop,
  };
}

type PopWithRearrangeInfo<T = any> = {
  callback(info: PopWithRearrange<T>): void;
  info: PopWithRearrange<T>;
  callTime: number;
};
export type PopWithRearrange<T = any> = {
  closeSet: Set<SetValue<T>>;
  closeIt: SetValue<T>;
  size: GetValue<number>;
  getIndex: GetValue<number>;
  setIndex(n: number): void;
  callTime(): number;
};
export function createPopListWithRearrange() {
  const popList = createSignal<PopWithRearrangeInfo<any>[]>(emptyArray as any);
  const arrangeList = createSignal<PopWithRearrangeInfo<any>[]>(
    emptyArray as any
  );

  function size() {
    return arrangeList.get().length;
  }

  function createPop<T = any>(
    /**需要唯一性*/
    callback: (info: PopWithRearrange<T>) => void,
    index: number = -1
  ) {
    const old = popList.get().find(x => x.callback == callback);
    if (old) {
      old.info.setIndex(index);
      old.callTime++;
      return old.info;
    }
    function getIndex() {
      return arrangeList.get().findIndex(v => v == popFun);
    }
    function notSelf(x: PopWithRearrangeInfo<T>) {
      return x != popFun;
    }
    const closeSet = new Set<SetValue<T>>();
    const info: PopWithRearrange<T> = {
      closeSet,
      closeIt(v) {
        closeSet.forEach(closeIt => {
          closeIt(v);
        });
        popList.set(popList.get().filter(notSelf));
        arrangeList.set(arrangeList.get().filter(notSelf));
      },
      callTime() {
        return popFun.callTime;
      },
      size,
      getIndex,
      setIndex(n) {
        const list = arrangeList.get().slice();
        n = circleFormat(n, list.length);
        removeEqual(list, popFun);
        list.splice(n, 0, popFun);
        arrangeList.set(list);
      },
    };
    const popFun: PopWithRearrangeInfo<T> = {
      callback,
      info,
      callTime: 1,
    };
    popList.set(popList.get().concat(popFun));
    const list = arrangeList.get().slice();
    index = circleFormat(index, list.length + 1);
    list.splice(index, 0, popFun);
    arrangeList.set(list);
    return info;
  }
  function renderPop() {
    renderArray(popList.get, renderPopArrangeFun);
  }

  return {
    renderPop,
    createPop,
  };
}
function renderPopArrangeFun(pop: PopWithRearrangeInfo<any>) {
  return pop.callback(pop.info);
}
export const { renderPop, createPop } = createPopList();
