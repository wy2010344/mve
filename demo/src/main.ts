import { hookBuildChildren } from "./hookChildren"
import { dom } from "./dom"
import { Signal, trackSignal } from "./signal"
import { emptyArray, EmptyFun, GetValue, quote, ReadArray, run } from "wy-helper"
import { hookAlterDestroyList } from "./cache"
import { renderForEach } from "./renderForEach"

const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = renderApp(app, () => {
  dom.div({
    className: "p-8 bg-green-400"
  }).render(() => {
    const a = Signal(0)
    const b = Signal(0)

    const list = Signal<number[]>(emptyArray as number[])
    dom.button({
      onClick() {
        a.set(a.get() + 1)
        b.set(b.get() + 2)
        list.set(list.get().concat(Date.now()))
      }
    }).renderText`点击${a.get}`

    dom.hr().render()

    trackSignal(() => {
      return a.get() + b.get()
    }, x => {
      console.log("跟踪到", x)
    })
    dom.span().renderText`--${b.get}--`

    dom.hr().render()

    renderArray(list.get, quote, getRow => {
      dom.div().renderText`ddd`//`---${() => getRow()[0]}--- ${() => getRow()[1]}---`
    })
  })
})


function renderApp(app: Node, fun: EmptyFun) {
  const list: EmptyFun[] = []
  hookAlterDestroyList(list)
  hookBuildChildren(app, fun)
  hookAlterDestroyList(undefined)
  return () => {
    list.forEach(run)
  }
}


export function renderArray<T>(
  getVs: GetValue<ReadArray<T>>,
  getKey: (v: T, i: number) => any,
  render: (get: GetValue<readonly [T, number]>) => void,
) {
  renderForEach<readonly [T, number]>(
    function (callback) {
      const vs = getVs()
      for (let i = 0; i < vs.length; i++) {
        const v = vs[i]
        const key = getKey(v, i)
        const setValue = callback(key, render)
        setValue([v, i])
      }
    })
}