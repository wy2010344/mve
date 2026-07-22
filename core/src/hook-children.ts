import {
  addEffect,
  EmptyFun,
  GetValue,
  SetValue,
  StoreRef,
  storeRef,
  trackSignal,
  collectSignal,
  DiffMoveFun,
} from 'wy-helper';
import { hookCurrentStateHolder } from './cache';
import { RootReturn, StateHolderWithNode } from './state-holder';

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
  set: SetValue<V, void, any[]>,
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
    callback: (this: StateHolderWithNode<T, F>) => void
  ) => GetValue<F>,
  createRoot: (
    p: T,
    callback: (this: StateHolderWithNode<T, F>) => void
  ) => RootReturn<T, F>
) {
  return {
    createRoot(node: T, fun: (this: StateHolderWithNode<T, F>) => void) {
      const o = createRoot(node, function () {
        fun.apply(this);
        hookChangeChildren(node, this.target, move);
      });
      return o.destroy;
    },
    renderPortal(pNode: T, fun: (this: StateHolderWithNode<T, F>) => void) {
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
    renderChildren(node: T, fun: (this: StateHolderWithNode<T, F>) => void) {
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
