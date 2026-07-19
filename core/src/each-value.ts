// ---------------------------------------------------------------------------
// EachValue — 继承 StateHolderI，实现 EachTime
// ---------------------------------------------------------------------------

import { GetValue } from 'wy-helper';
import { Creater, RenderForEachArg } from './state-holder';
import { StateHolderI } from './state-holder-i';

export interface EachTime<T> {
  getIndex(): number;
  getValue(): T;
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
