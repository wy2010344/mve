import { hookAddDestroy } from "mve-core";
import { renderDom } from "mve-dom";
import { renderCanvas } from "mve-dom-helper";
import { createSignal } from "wy-helper";
import demo3 from "./demo3";
import { hookDestroy } from "mve-helper";
import demo4 from "./demo4";
import demo5 from "./demo5";

export default function () {

  const w = createSignal(window.innerWidth)
  const h = createSignal(window.innerHeight)
  function resize() {
    w.set(window.innerWidth)
    h.set(window.innerHeight)
  }
  window.addEventListener("resize", resize)
  hookDestroy(() => {
    window.removeEventListener("resize", resize)
  })
  const canvas = renderDom("canvas", {
    a_width: w.get,
    a_height: h.get
  })

  console.log("dddd")
  renderCanvas(canvas, () => {
    // demo2()
    // demo1()
    // demo3()
    // demo4()
    demo5()
  })
}
