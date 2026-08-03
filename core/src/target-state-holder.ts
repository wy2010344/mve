// ---------------------------------------------------------------------------
// TargetStateHolder — 继承 StateHolderI，提供 target memo
// ---------------------------------------------------------------------------

import { memo, MemoFun } from 'wy-helper';
import { StateHolderI } from './state-holder-i';
import { RootReturn, ShareConfig, StateHolderWithNode } from './state-holder';
import { ContextI, parentContext } from './context';

export class TargetStateHolder<Node, Target>
  extends StateHolderI<Node, Target>
  implements RootReturn<Target>, StateHolderWithNode<Node, Target>
{
  readonly target: MemoFun<Target>;

  constructor(
    config: ShareConfig<Node, Target>,
    readonly node: Node,
    private readonly callback: (
      this: StateHolderWithNode<Node, Target>
    ) => void,
    parent?: StateHolderI<unknown, unknown>
  ) {
    super(config, parent);
    this.target = memo(_old => {
      return this.config.purifyList(this.nodes);
      // const newList: Node[] = [];
      // purifyList(this.nodes, newList);
      // return newList;
    }, this.config.after);
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

export function renderRoot<Node, Target>(
  node: Node,
  config: ShareConfig<Node, Target>,
  callback: (this: StateHolderWithNode<Node, Target>) => void
): RootReturn<Target> {
  const holder = new TargetStateHolder(config, node, callback);
  holder.create();
  return holder;
}
