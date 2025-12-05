import {
  addEffect,
  emptyArray,
  EmptyFun,
  emptyFun,
  GetValue,
  memo,
  MemoFun,
  objectFreeze,
  SetValue,
  StoreRef,
  storeRef,
  trackSignal,
  collectSignal,
  diffMove,
  RenderChildrenOperante,
  DiffMoveFun,
  ReadSet,
} from 'wy-helper';
import {
  createContext,
  hookAddDestroy,
  hookAlterChildren,
  hookIsDestroyed,
  renderStateHolder,
} from '.';

export function addTrackEffect<T>(
  get: GetValue<T>,
  toEffect: (v: T) => EmptyFun,
  level = 0
) {
  const addDestroy = hookAddDestroy();
  addDestroy(
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
  const isDestroyed = hookIsDestroyed();
  let lastValue: any = effect;
  function effect() {
    if (isDestroyed()) {
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
  hookAddDestroy()(destroy);
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

export type HookChild<T> = T | (() => HookChild<T>[]);

function purifyList<T>(children: HookChild<T>[], list: T[]) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (typeof child == 'function') {
      purifyList((child as any)(), list);
    } else {
      list.push(child);
    }
  }
}

function getRenderChildrenList<T>(list: HookChild<T>[], after: SetValue<T[]>) {
  const get = memo(function () {
    objectFreeze(list);
    const newList: T[] = [];
    purifyList(list, newList);
    return newList;
  }, after);
  return get;
}

function purifySet<T>(children: HookChild<T>[], list: Set<T>) {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (typeof child == 'function') {
      purifySet((child as any)(), list);
    } else {
      list.add(child);
    }
  }
}

function getRenderChildrenSet<T>(
  list: HookChild<T>[],
  after: SetValue<Set<T>>
) {
  const get = memo(function () {
    objectFreeze(list);
    const newList = new Set<T>();
    purifySet(list, newList);
    return newList;
  }, after);
  return get;
}

export interface CollectObject<N, F> {
  collect<T = void>(fun: (n: N) => T): T;
  target: GetValue<F>;
}
/**
 * 这个可以在canvas中实践
 */
class AppendList<T, N> implements CollectObject<N, readonly T[]> {
  private list: HookChild<T>[] = [];
  constructor(
    public readonly node: N,
    private readonly after: SetValue<T[]> = emptyFun
  ) {
    this.target = getRenderChildrenList(this.list, this.after);
  }
  readonly target;
  collect<T = void>(fun: (n: N) => T) {
    const beforeList = hookAlterChildren(this.list);
    const o = renderStateHolder(() => {
      parentCtx.provide(this.node);
      return fun(this.node);
    });
    hookAlterChildren(beforeList);
    return o;
  }
}

export function createAppendList<T, N>(
  node: N,
  after?: SetValue<readonly T[]>
): CollectObject<N, readonly T[]> {
  return new AppendList(node, after);
}

export class AppendSet<T, N> implements CollectObject<N, ReadSet<T>> {
  private list: HookChild<T>[] = [];
  constructor(
    public readonly node: N,
    private readonly after: SetValue<Set<T>> = emptyFun
  ) {
    this.target = getRenderChildrenSet(this.list, this.after);
  }
  readonly target;
  collect<T = void>(fun: (n: N) => T) {
    const beforeList = hookAlterChildren(this.list);
    const o = renderStateHolder(() => {
      parentCtx.provide(this.node);
      return fun(this.node);
    });
    hookAlterChildren(beforeList);
    return o;
  }
}

export function createAppendSet<T, N>(
  node: N,
  after?: SetValue<ReadSet<T>>
): CollectObject<N, ReadSet<T>> {
  return new AppendSet(node, after);
}

const parentCtx = createContext<any>(undefined!);

export function hookCurrentParent<T>() {
  return parentCtx.consume() as T;
}

export function createRenderChildren<T, F>(
  move: DiffMoveFun<T, F>,
  createCollect: (p: T) => CollectObject<T, F>
) {
  return {
    renderPortal(pNode: T, fun: SetValue<T>) {
      const list = storeRef<F>(move.empty);
      const addDestroy = hookAddDestroy();
      const appendList = createCollect(pNode);
      appendList.collect(fun);
      hookChangeChildren(pNode, appendList.target, move, list);
      addDestroy(() => {
        addEffect(() => {
          move.clear(pNode, list.get());
          list.set(move.empty);
        }, -2);
      });
      return appendList;
    },
    renderChildren(node: T, fun: SetValue<T>) {
      const appendList = createCollect(node);
      appendList.collect(fun);
      hookChangeChildren(node, appendList.target, move);
      return appendList;
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
  const isDestroyed = hookIsDestroyed();
  const effect: {
    (): void;
    newList: F;
  } = function () {
    if (isDestroyed()) {
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
