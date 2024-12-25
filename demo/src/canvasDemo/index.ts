import { hookAddDestroy } from "mve-core";
import { renderDom } from "mve-dom";
import { drawText, drawTextWrap, hookRect, measureTextWrap, renderCanvas } from "mve-dom-helper";
import { createSignal } from "wy-helper";
import demo1 from "./demo1";
import demo2 from "./demo2";

export default function () {

  const w = createSignal(window.innerWidth)
  const h = createSignal(window.innerHeight)
  function resize() {
    w.set(window.innerWidth)
    h.set(window.innerHeight)
  }
  window.addEventListener("resize", resize)
  hookAddDestroy()(() => {
    window.removeEventListener("resize", resize)
  })
  const canvas = renderDom("canvas", {
    a_width: w.get,
    a_height: h.get
  })

  renderCanvas(canvas, () => {
    demo2()
  })
}
