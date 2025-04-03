import { hookAddResult } from "mve-core";
import { fdom } from "mve-dom";
import { hookDestroy, renderArray } from "mve-helper";
import { addEffect, createSignal, emptyArray, emptyFun, EmptyFun, SetValue } from "wy-helper";



class PopFun<T> {
  constructor(
    readonly render: SetValue<SetValue<T>>,
    private readonly onClose: SetValue<T>
  ) { }
  close = (value: T) => {
    this.onClose(value)
    popList.set(popList.get().filter(x => x != this))
  }
}
const popList = createSignal<PopFun<any>[]>(emptyArray as any)
export function createPop<T = any>(
  callback: SetValue<SetValue<T>>,
  onClose: SetValue<T> = emptyFun
) {
  const popFun = new PopFun(callback, onClose)
  popList.set(popList.get().concat(popFun))
  return popFun.close
}
function renderPopFun(pop: PopFun<any>) {
  return pop.render(pop.close)
}
export function renderPop() {
  renderArray(popList.get, renderPopFun)
}



export function hookExitAnimate<T extends HTMLElement>(
  div: T,
  operateClone: (div: T) => {
    then(call: SetValue<any> | EmptyFun): any
  }
) {
  hookDestroy(() => {
    const rect = div.getBoundingClientRect()
    //并不需要copy
    const copy = div//div.cloneNode(true) as T
    addEffect(() => {
      createPop((close) => {
        //可能会出现更多自定义样式
        fdom.div({
          className: 'fixed z-10',
          s_left: rect.left + 'px',
          s_top: rect.top + 'px',
          children() {
            hookAddResult(copy)
          }
        })
        addEffect(() => {
          operateClone(copy).then(close as EmptyFun)
        })
      })
    })
  })
}