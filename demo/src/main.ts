import { emptyArray, quote, createSignal, trackSignal } from "wy-helper"
import { createRoot, dom } from 'mve-dom'
import { renderArray } from 'mve-helper'
import { hookAddDestroy } from "mve-core"
const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = createRoot(app, () => {
  dom.div({
    className: "p-8 bg-green-400"
  }).render(() => {
    const a = createSignal(0)
    const b = createSignal(0)

    const list = createSignal<number[]>(emptyArray as number[])
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
      dom.div().renderText`---${() => getRow().item}--- ${() => getRow().index}---`
      dom.button({
        onClick() {
          list.set(list.get().filter(v => v != getRow().item))
        }
      }).renderText`删除`
      count()
      hookAddDestroy(() => {
        console.log("销毁了...")
      })
    })
  })
})



function count() {
  const s = createSignal(0)

  dom.button({
    onClick() {
      s.set(s.get() + 1)
    }
  }).renderText`增加数字${s.get}`
}