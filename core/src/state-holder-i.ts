// ---------------------------------------------------------------------------
// StateHolderI — 声明在 EachValue / TargetStateHolder 之前，
// 但它们的方法体在运行时才引用彼此，所以没有时序问题。
// ---------------------------------------------------------------------------

import {
  BaseRMap,
  EmptyFun,
  emptyObject,
  GetValue,
  memo,
  MemoFun,
  normalMapCreater,
  ReadSet,
  run,
  SetValue,
} from 'wy-helper';
import { ContextI, parentContext } from './context';
import {
  Creater,
  RenderForEachArg,
  StateHolder,
  StateHolderWithNode,
} from './state-holder';
import { ValueOrGetList } from './value-or-get-list';
import {
  ListTargetStateHolder,
  SetTargetStateHolder,
} from './target-state-holder';
import { hookAlterStateHolder } from './cache';
import { EachTime } from './each-value';

// ---------------------------------------------------------------------------
// ForEachModal
// ---------------------------------------------------------------------------

export interface ForEachModal<Node, T, K, O> {
  readonly cacheMap: BaseRMap<K, EachValue<Node, T, K, O>[]>;
  readonly newMap: BaseRMap<K, EachValue<Node, T, K, O>[]>;
  readonly thisTimeAdd: EachValue<Node, T, K, O>[];
  readonly thisChildren: EachValue<Node, T, K, O>[];
}
export class DuplicateError extends Error {
  constructor(
    message: string,
    readonly key: unknown
  ) {
    super(message);
  }
}

export class StateHolderI<Node> implements StateHolder<Node> {
  readonly nodes: ValueOrGetList<Node>[] = [];
  readonly contexts: [ContextI<unknown>, unknown][] = [];

  private readonly _children = new Set<StateHolderI<Node>>();
  private readonly _destroyList: EmptyFun[] = [];
  private _destroyed = false;
  private _endBuild = false;

  constructor(
    readonly parent?: StateHolderI<Node>,
    readonly parentContextIndex: number = parent?.contexts.length ?? 0
  ) {
    this.parent?._children.add(this);
  }

  destroyed(): boolean {
    return this._destroyed;
  }

  protected buildChildren(): void {}

  create(): void {
    if (this._endBuild) {
      throw new Error('已经初始化过了');
    }
    const before = hookAlterStateHolder(this);
    this.buildChildren();
    hookAlterStateHolder(before);
    this._endBuild = true;
  }

  addNode(n: Node): void {
    if (this._destroyed) {
      throw new Error('已经结构构建，无法再继续添加');
    }
    this.nodes.push(n);
  }

  addDestroy(destroy: EmptyFun): void {
    if (this._destroyed) {
      throw new Error('can not add to a destroyed holder');
    }
    this._destroyList.push(destroy);
  }

  destroy(): void {
    if (this._destroyed) {
      console.warn('duplicate destroy', this);
      return;
    }
    this._destroyed = true;
    this._children.forEach(destroyHolder);
    this._destroyList.forEach(run);
  }

  removeFromParent(): void {
    this.parent?.removeChild(this);
  }

  private removeChild(child: StateHolderI<Node>): void {
    if (this._children.delete(child)) {
      child.destroy();
    }
  }

  // -- Context --------------------------------------------------------------

  provide<T>(context: ContextI<T>, value: T): void {
    if (this._endBuild) {
      throw new Error('已经初始化后不希望再provide');
    }
    this.contexts.push([context, value]);
  }

  consume<T>(context: ContextI<T>): T {
    const provider = this.findProvider(context);
    if (provider) {
      return provider[1] as T;
    }
    return context.value;
  }

  private findProvider<T>(
    context: ContextI<T>
  ): [ContextI<unknown>, unknown] | undefined {
    let holder: StateHolderI<Node> | undefined = this;
    let begin = holder.contexts.length;
    while (holder) {
      for (let i = begin - 1; i > -1; i--) {
        const provider = holder.contexts[i];
        if (provider[0] == context) {
          return provider;
        }
      }
      begin = holder.parentContextIndex;
      holder = holder.parent;
    }
    return undefined;
  }

  // -- renderForEach --------------------------------------------------------

  renderForEach<T, K, O>(
    forEach: (callback: (key: K, value: T) => GetValue<O>) => void,
    creater: Creater<Node, T, K, O>,
    arg: RenderForEachArg<K> = emptyObject
  ): MemoFun<any> {
    if (this._endBuild) {
      throw new Error('已经初始化过了');
    }
    const createMap: <V>() => BaseRMap<K, V> =
      arg.createMap || normalMapCreater;
    const duplicateInfo = arg.duplicateInfo ?? 'warn';
    const contextIndex = this.contexts.length;
    const forEachSignal = memo<ForEachModal<Node, T, K, O>>(
      old => {
        const cacheMap = old?.newMap ?? createMap<EachValue<Node, T, K, O>[]>();
        const newMap = createMap<EachValue<Node, T, K, O>[]>();
        const thisTimeAdd: EachValue<Node, T, K, O>[] = [];
        const thisChildren: EachValue<Node, T, K, O>[] = [];
        let index = 0;

        forEach((key, value) => {
          const holders = cacheMap.get(key);
          let ev: EachValue<Node, T, K, O>;

          if (holders?.length) {
            ev = holders.shift()!;
          } else {
            ev = new EachValue(
              forEachSignal,
              this,
              contextIndex,
              creater,
              key,
              arg
            );
            thisTimeAdd.push(ev);
          }

          ev.value = value;
          ev.index = index++;

          const envs = newMap.get(key);
          if (envs) {
            envs.push(ev);
            if (duplicateInfo == 'warn') {
              console.warn(`重复的key`, key, `出现第${envs.length}次`);
            } else if (duplicateInfo == 'throw') {
              throw new DuplicateError(`重复的key出现第${envs.length}次`, key);
            }
          } else {
            newMap.set(key, [ev]);
          }

          thisChildren.push(ev);
          return ev.invoke;
        });

        return { cacheMap, newMap, thisTimeAdd, thisChildren };
      },
      modal => {
        modal.cacheMap.forEach(oldRemoveStateHolders);
        modal.thisTimeAdd.forEach(thisTimeAddEach);
      }
    );

    this.nodes.push(() => {
      return forEachSignal().thisChildren.flatMap(item => item.nodes);
    });
    return forEachSignal;
  }

  // -- renderNode -----------------------------------------------------------

  renderListNode(
    node: Node,
    after: SetValue<readonly Node[]>,
    callback: (this: StateHolderWithNode<Node, readonly Node[]>) => void
  ): GetValue<readonly Node[]> {
    const child = new ListTargetStateHolder(node, after, callback, this);
    child.create();
    return child.target;
  }

  renderSetNode(
    node: Node,
    after: SetValue<ReadSet<Node>>,
    callback: (this: StateHolderWithNode<Node, ReadSet<Node>>) => void
  ): GetValue<ReadSet<Node>> {
    const child = new SetTargetStateHolder(node, after, callback, this);
    child.create();
    return child.target;
  }

  getParent(): unknown {
    return this.consume(parentContext);
  }
}

export class EachValue<Node, T, K, O>
  extends StateHolderI<Node>
  implements EachTime<T>
{
  value: T = null as T;
  index: number = 0;
  private _out!: O;

  constructor(
    readonly getSignal: GetValue<unknown>,
    parent: StateHolderI<Node>,
    parentContextIndex: number,
    private readonly _creater: Creater<Node, T, K, O>,
    private readonly _key: K,
    arg: RenderForEachArg<K>
  ) {
    super(parent, parentContextIndex);
    if (arg.bindIndex) {
      this.getIndex = this.getIndex.bind(this);
    }
    if (arg.bindOut) {
      this.invoke = this.invoke.bind(this);
    }
    if (arg.bindValue) {
      this.getValue = this.getValue.bind(this);
    }
  }

  getValue(): T {
    this.getSignal();
    return this.value;
  }

  getIndex(): number {
    this.getSignal();
    return this.index;
  }

  invoke(): O {
    return this._out;
  }

  override buildChildren(): void {
    this._out = this._creater(this._key, this);
  }
}

// ---------------------------------------------------------------------------
// internal
// ---------------------------------------------------------------------------

function destroyHolder(stateHolder: StateHolderI<any>): void {
  stateHolder.destroy();
}

function oldRemoveStateHolders<Node, T, K, O>(
  children: EachValue<Node, T, K, O>[]
) {
  children.forEach(removeStateHolder);
}

function removeStateHolder<Node, T, K, O>(child: EachValue<Node, T, K, O>) {
  child.destroy();
}

function thisTimeAddEach<Node, T, K, O>(add: EachValue<Node, T, K, O>) {
  add.create();
}
