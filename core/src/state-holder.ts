import { EmptyFun, GetValue, MemoFun, SetValue, BaseRMap } from 'wy-helper';
import { Context, ContextI } from './context';
import { EachTime, EachValue } from './each-value';

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

  renderNode(
    node: Node,
    after: SetValue<Node[]>,
    callback: (this: StateHolderWithNode<Node>) => void
  ): GetValue<Node[]>;

  getParent(): Node | undefined;
}

export interface StateHolderWithNode<Node> extends StateHolder<Node> {
  readonly node: Node;
}
