// ---------------------------------------------------------------------------
// TargetStateHolder — 继承 StateHolderI，提供 target memo
// ---------------------------------------------------------------------------

import { GetValue, memo, MemoFun, ReadSet, SetValue } from 'wy-helper';
import { StateHolderI } from './state-holder-i';
import { RootReturn, StateHolderWithNode } from './state-holder';
import { purifyList, purifySet } from './value-or-get-list';
import { ContextI, parentContext } from './context';

export class ListTargetStateHolder<Node>
  extends StateHolderI<Node>
  implements
    RootReturn<Node, readonly Node[]>,
    StateHolderWithNode<Node, readonly Node[]>
{
  readonly target: MemoFun<readonly Node[]>;

  constructor(
    readonly node: Node,
    after: SetValue<readonly Node[]> | undefined,
    private readonly callback: (
      this: StateHolderWithNode<Node, readonly Node[]>
    ) => void,
    parent?: StateHolderI<Node>
  ) {
    super(parent);
    this.target = memo<readonly Node[]>(_old => {
      const newList: Node[] = [];
      purifyList(this.nodes, newList);
      return newList;
    }, after);
  }

  protected override buildChildren(): void {
    this.provide(parentContext as ContextI<Node>, this.node);
    this.callback();
  }

  toString(): string {
    return 'list-render';
  }
}

// ---------------------------------------------------------------------------
// renderRoot — 入口函数
// ---------------------------------------------------------------------------

export function renderListRoot<Node>(
  node: Node,
  after: SetValue<readonly Node[]>,
  callback: (this: StateHolderWithNode<Node, readonly Node[]>) => void
): RootReturn<Node, readonly Node[]> {
  const holder = new ListTargetStateHolder(node, after, callback);
  holder.create();
  return holder;
}

export class SetTargetStateHolder<Node>
  extends StateHolderI<Node>
  implements
    RootReturn<Node, ReadSet<Node>>,
    StateHolderWithNode<Node, ReadSet<Node>>
{
  readonly target: MemoFun<ReadSet<Node>>;

  constructor(
    readonly node: Node,
    after: SetValue<ReadSet<Node>> | undefined,
    private readonly callback: (
      this: StateHolderWithNode<Node, ReadSet<Node>>
    ) => void,
    parent?: StateHolderI<Node>
  ) {
    super(parent);
    this.target = memo<ReadSet<Node>>(_old => {
      const newList = new Set<Node>();
      purifySet(this.nodes, newList);
      return newList;
    }, after);
  }

  protected override buildChildren(): void {
    this.provide(parentContext as ContextI<Node>, this.node);
    this.callback();
  }

  toString(): string {
    return 'list-render';
  }
}

// ---------------------------------------------------------------------------
// renderRoot — 入口函数
// ---------------------------------------------------------------------------

export function renderSetRoot<Node>(
  node: Node,
  after: SetValue<ReadSet<Node>>,
  callback: (this: StateHolderWithNode<Node, ReadSet<Node>>) => void
): RootReturn<Node, ReadSet<Node>> {
  const holder = new SetTargetStateHolder(node, after, callback);
  holder.create();
  return holder;
}
