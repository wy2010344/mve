import {
  addEffect,
  EmptyFun,
  emptyFun,
  GetValue,
  memo,
  objectFreeze,
  SetValue,
  StoreRef,
  storeRef,
  trackSignal,
  collectSignal,
  DiffMoveFun,
  ReadSet,
} from 'wy-helper';
import { hookCurrentStateHolder } from './cache';
import { StateHolder, StateHolderWithNode } from './state-holder';

export function addTrackEffect<T>(
  get: GetValue<T>,
  toEffect: (v: T) => EmptyFun,
  level = 0
) {
  const stateHolder = hookCurrentStateHolder(true);
  stateHolder.addDestroy(
    trackSignal(get, v => {
      const effect = toEffect(v);
      addEffect(effect, level);
    })
  );
}

export function hookEffectCollect<V>(
  get: GetValue<V>,
  set: SetValue<V>,
  level = 0,
  a?: any,
  b?: any,
  c?: any
) {
  const stateHolder = hookCurrentStateHolder(true);
  let lastValue: any = effect;
  function effect() {
    if (stateHolder?.destroyed()) {
      return;
    }
    const value = collect(get);
    if (value != lastValue) {
      lastValue = value;
      set(value, a, b, c);
    }
  }

  const { destroy, collect } = collectSignal(function () {
    addEffect(effect, level);
  });
  stateHolder.addDestroy(destroy);
}

export function hookTrackAttr<V>(
  get: GetValue<V>,
  set: SetValue<V>,
  b?: any,
  f?: any
) {
  hookEffectCollect(get, set, -1, b, f);
}

export type OrFun<T extends {}> = {
  [key in keyof T]: T[key] | GetValue<T[key]>;
};

export function createRenderChildren<T, F>(
  move: DiffMoveFun<T, F>,
  createCollect: (
    p: T,
    callback: (s: StateHolderWithNode<T>) => void
  ) => GetValue<F>
) {
  return {
    renderPortal(pNode: T, fun: (s: StateHolderWithNode<T>) => void) {
      const list = storeRef<F>(move.empty);
      const stateHolder = hookCurrentStateHolder(true);
      const get = createCollect(pNode, fun);
      hookChangeChildren(pNode, get, move, list);
      stateHolder.addDestroy(() => {
        addEffect(() => {
          move.clear(pNode, list.get());
          list.set(move.empty);
        }, -2);
      });
    },
    renderChildren(node: T, fun: SetValue<StateHolderWithNode<T>>) {
      const get = createCollect(node, fun);
      hookChangeChildren(node, get, move);
    },
  };
}

function hookChangeChildren<Node, F>(
  pNode: Node,
  getChildren: GetValue<F>,
  move: DiffMoveFun<Node, F>,
  listRef?: StoreRef<F>
) {
  const autoClear = !listRef;
  listRef = listRef || storeRef<F>(move.empty);
  const stateHolder = hookCurrentStateHolder(true);
  const effect: {
    (): void;
    newList: F;
  } = function () {
    if (stateHolder.destroyed()) {
      if (autoClear) {
        listRef.set(move.empty);
      }
      return;
    }
    const newList = effect.newList;
    //在-2时进行布局的重新整理
    const oldList = listRef.get();
    move.move(pNode, oldList, newList);
    listRef.set(newList);
  } as any;
  addTrackEffect(
    getChildren,
    function (list) {
      effect.newList = list;
      return effect;
    },
    -2
  );
}
