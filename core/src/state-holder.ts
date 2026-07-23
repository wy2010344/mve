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

// ---------------------------------------------------------------------------
// 基础类型
// ---------------------------------------------------------------------------

export type Creater<Node, T, K, O> = (
  this: StateHolder<Node>,
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

export interface StateHolder<Node> {
  provide<T>(context: Context<T>, value: T): void;
  consume<T>(context: Context<T>): T;
  addNode(n: Node): void;
  addDestroy(destroy: EmptyFun): void;
  destroyed(): boolean;

  renderForEach<T, K, O>(
    forEach: (callback: (key: K, value: T) => GetValue<O>) => void,
    creater: Creater<Node, T, K, O>,
    arg?: RenderForEachArg<K>
  ): MemoFun<any>;

  renderListNode(
    node: Node,
    after: SetValue<readonly Node[]>,
    callback: (this: StateHolderWithNode<Node, readonly Node[]>) => void
  ): GetValue<readonly Node[]>;

  renderSetNode(
    node: Node,
    after: SetValue<ReadSet<Node>>,
    callback: (this: StateHolderWithNode<Node, ReadSet<Node>>) => void
  ): GetValue<ReadSet<Node>>;

  getParent(): unknown;
}

export interface StateHolderWithNode<Node, T> extends StateHolder<Node> {
  readonly node: Node;
  readonly target: GetValue<T>;
}

export interface RootReturn<Node, F> {
  destroy(): void;
  readonly target: GetValue<F>;
}
