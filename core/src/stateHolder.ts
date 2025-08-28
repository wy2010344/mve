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
    if (this._destroyed) {
      throw new Error('can not add to a destroyed holder')
    }
    this.destroyList.push(destroy)
  }
  private _destroyed = false
  destroyed = () => this._destroyed
  destroy() {
    if (this._destroyed) {
      console.warn('duplicate destroy', this)
      return
    }
    this._destroyed = true
    this.children.forEach(destroyHolder)
    this.destroyList.forEach(run)
  }

  private removeChild(child: StateHolder) {
    if (this.children.delete(child)) {
      child.destroy()
    }
  }
  public readonly contexts: {
    key: Context<any>,
    value: any
  }[] = []
  private children = new Set<StateHolder>

  removeFromParent() {
    this.parent!.removeChild(this)
  }
}

function destroyHolder(stateHolder: StateHolder) {
  stateHolder.destroy()
}