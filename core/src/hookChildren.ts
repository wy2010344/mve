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

/**
 * 这个可以在canvas中实践
 */
export class AppendList<T, N> {
  private list: HookChild<T>[] = [];
  constructor(
    public readonly node: N,
    private readonly after: SetValue<T[]> = emptyFun
  ) {
    this.target = getRenderChildrenList(this.list, this.after);
  }

  readonly target: MemoFun<T[]>;

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

const parentCtx = createContext<any>(undefined!);

export function hookCurrentParent<T>() {
  return parentCtx.consume() as T;
}

export function createRenderChildren<T>(arg: RenderChildrenOperante<T>) {
  return {
    renderPortal(pNode: T, fun: SetValue<T>) {
      const list = storeRef<T[]>(emptyArray as T[]);
      const addDestroy = hookAddDestroy();
      const appendList = new AppendList(pNode);
      appendList.collect(fun);
      hookChangeChildren(pNode, appendList.target, arg, list);
      addDestroy(() => {
        addEffect(() => {
          list.get().forEach(function (node) {
            arg.removeChild(pNode, node);
          });
          list.get().length = 0;
          list.set(emptyArray);
        }, -2);
      });
      return appendList;
    },
    renderChildren(node: T, fun: SetValue<T>) {
      const appendList = new AppendList(node);
      appendList.collect(fun);
      hookChangeChildren(node, appendList.target, arg);
      return appendList;
    },
  };
}

function hookChangeChildren<Node>(
  pNode: Node,
  getChildren: GetValue<readonly Node[]>,
  arg: // lastChild,
  RenderChildrenOperante<Node>,
  listRef?: StoreRef<readonly Node[]>
) {
  const autoClear = !listRef;
  listRef = listRef || storeRef<readonly Node[]>(emptyArray);
  const isDestroyed = hookIsDestroyed();
  const effect: {
    (): void;
    newList: readonly Node[];
  } = function () {
    if (isDestroyed()) {
      if (autoClear) {
        listRef.set(emptyArray);
      }
      return;
    }
    const newList = effect.newList;
    //在-2时进行布局的重新整理
    const oldList = listRef.get();
    diffMove(arg, pNode, oldList, newList);
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
