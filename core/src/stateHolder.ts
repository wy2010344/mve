import { EmptyFun, run } from "wy-helper";
import { Context } from "./context";

export class StateHolder {

  constructor(
    public readonly parent?: StateHolder,
    public readonly parentContextIndex: number = 0
  ) {
    this.parent?.children.add(this)
    this.addDestroy = this.addDestroy.bind(this)
  }
  private destroyList: EmptyFun[] = []
  addDestroy(destroy: EmptyFun) {
    this.destroyList.push(destroy)
  }
  destroy() {
    this.children.forEach(destroyHolder)
    this.destroyList.forEach(run)
  }

  removeChild(child: StateHolder) {
    if (this.children.delete(child)) {
      child.destroy()
    }
  }
  public readonly contexts: {
    key: Context<any>,
    value: any
  }[] = []
  private children = new Set<StateHolder>
}

function destroyHolder(stateHolder: StateHolder) {
  stateHolder.destroy()
}