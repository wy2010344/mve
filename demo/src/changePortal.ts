import { hookAddResult, renderSubOps } from "mve-core";
import { dom } from "mve-dom";
import { renderIf } from "mve-helper";
import { createSignal } from "wy-helper";

export default function () {

  const version = createSignal(0)
  const ops = renderSubOps(() => {
    const sversion = createSignal(0)
    dom.button({
      onClick() {
        sversion.set(sversion.get() + 2)
        version.set(version.get() + 1)
      }
    }).renderText`abc--${version.get}--${sversion.get}`
  })
  dom.div({
    className: "bg-red-400 p-20"

  }).render(() => {

    renderIf(() => {
      return (version.get() % 2)
    }, () => {

      hookAddResult(ops)
    })
  })


  dom.div({
    className: "bg-green-400 p-20"
  }).render(() => {
    renderIf(() => {
      return !(version.get() % 2)
    }, () => {

      hookAddResult(ops)
    })
  })

}