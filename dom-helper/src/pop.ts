import { hookAddResult } from "mve-core";
import { fdom } from "mve-dom";
import { hookDestroy, renderArray } from "mve-helper";
import { cns } from "wy-dom-helper";
import { addEffect, createSignal, emptyArray, emptyFun, EmptyFun, SetValue, StoreRef } from "wy-helper";



class PopFun<T> {
  constructor(
    readonly render: SetValue<SetValue<T>>,
    private readonly onClose: SetValue<T>,
    private readonly popList: StoreRef<PopFun<any>[]>
  ) { }
  close = (value: T) => {
    this.onClose(value)
    this.popList.set(this.popList.get().filter(x => x != this))
  }
}


export function createPopList() {

  const popList = createSignal<PopFun<any>[]>(emptyArray as any)
  function createPop<T = any>(
    callback: SetValue<SetValue<T>>,
    onClose: SetValue<T> = emptyFun
  ) {
    const popFun = new PopFun(callback, onClose, popList)
    popList.set(popList.get().concat(popFun))
    return popFun.close
  }
  function renderPopFun(pop: PopFun<any>) {
    return pop.render(pop.close)
  }
  function renderPop() {
    renderArray(popList.get, renderPopFun)
  }

  return {
    renderPop,
    createPop
  }
}

export const { renderPop, createPop } = createPopList()


export function hookExitAnimate<T extends HTMLElement>(
  div: T,
  {
    className,
    operateClone
  }: {
    className?: string
    operateClone: (div: T) => {
      then(call: SetValue<any> | EmptyFun): any
    }
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
          className: cns('fixed', className),
          s_left: rect.left + 'px',
          s_top: rect.top + 'px',
          s_width: rect.width + 'px',
          s_height: rect.height + 'px',
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