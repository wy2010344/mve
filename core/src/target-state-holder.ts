// ---------------------------------------------------------------------------
// TargetStateHolder — 继承 StateHolderI，提供 target memo
// ---------------------------------------------------------------------------

import { GetValue, memo, MemoFun, SetValue } from 'wy-helper';
import { StateHolderI } from './state-holder-i';
import { StateHolder, StateHolderWithNode } from './state-holder';
import { purifyList } from './value-or-get-list';
import { ContextI, parentContext } from './context';

export interface RootReturn<Node> {
  destroy(): void;
  readonly target: GetValue<Node[]>;
}

export class TargetStateHolder<Node>
  extends StateHolderI<Node>
  implements RootReturn<Node>, StateHolderWithNode<Node>
{
  readonly target: MemoFun<Node[]>;

  constructor(
    readonly node: Node,
    after: SetValue<Node[]> | undefined,
    private readonly callback: (this: StateHolderWithNode<Node>) => void,
    parent?: StateHolderI<Node>
  ) {
    super(parent);
    this.target = memo<Node[]>(_old => {
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
    return 'root-render';
  }
}

// ---------------------------------------------------------------------------
// renderRoot — 入口函数
// ---------------------------------------------------------------------------

export function renderRoot<Node>(
  node: Node,
  after: SetValue<Node[]>,
  callback: (this: StateHolderWithNode<Node>) => void
): RootReturn<Node> {
  const holder = new TargetStateHolder(node, after, callback);
  holder.create();
  return holder;
}
