import {
  EmptyFun,
  GetValue,
  MemoFun,
  SetValue,
  BaseRMap,
  ReadSet,
} from 'wy-helper';
import { Context } from './context';
import { EachTime } from './each-value';
import { ValueOrGetList } from './value-or-get-list';

// ---------------------------------------------------------------------------
// 基础类型
// ---------------------------------------------------------------------------

export type Creater<Node, Target, T, K, O> = (
  this: StateHolder<Node, Target>,
  key: K,
  eachTime: EachTime<T>
) => O;

export type RenderForEachArg<K> = {
  bindIndex?: any;
  bindValue?: any;
  bindOut?: any;
  createMap?: <V>() => BaseRMap<K, V>;
  duplicateInfo?: 'ignore' | 'warn' | 'throw';
};
// ---------------------------------------------------------------------------
// StateHolder interface
// ---------------------------------------------------------------------------

export interface StateHolder<Node, Target> {
  provide<T>(context: Context<T>, value: T): void;
  consume<T>(context: Context<T>): T;
  addNode(n: Node): void;
  addDestroy(destroy: EmptyFun): void;
  destroyed(): boolean;

  renderForEach<T, K, O>(
    forEach: (callback: (key: K, value: T) => GetValue<O>) => void,
    creater: Creater<Node, Target, T, K, O>,
    arg?: RenderForEachArg<K>
  ): MemoFun<any>;

  renderNode<Node, Target>(
    node: Node,
    callback: (this: StateHolderWithNode<Node, Target>) => void,
    config: ShareConfig<Node, Target>
  ): GetValue<Target>;
  renderNode(
    node: Node,
    // after: SetValue<readonly Node[]>,
    callback: (this: StateHolderWithNode<Node, Target>) => void
  ): GetValue<Target>;

  // renderSetNode(
  //   node: Node,
  //   after: SetValue<ReadSet<Node>>,
  //   callback: (this: StateHolderWithNode<Node, ReadSet<Node>>) => void
  // ): GetValue<ReadSet<Node>>;

  getParent(): unknown;
}

export interface StateHolderWithNode<Node, T> extends StateHolder<Node, T> {
  readonly node: Node;
  readonly target: GetValue<T>;
}

export interface RootReturn<F> {
  destroy(): void;
  readonly target: GetValue<F>;
}

export interface ShareConfig<Node, Target> {
  after(a: Target): void;
  purifyList(list: readonly ValueOrGetList<Node>[]): Target;
}
