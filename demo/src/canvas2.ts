import { hookAddDestroy } from "mve-core";
import { renderDom } from "mve-dom";
import { hookRect, renderCanvas } from "./canvasRender";
import { createSignal } from "wy-helper";

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
    w.get()
    h.get()
    hookRect({
      x: 150,
      y: 500,
      draw(ctx) {
        const path = new Path2D()
        path.rect(0, 0, 300, 300)
        return {
          path,
          operates: [
            { type: "stroke", width: 10, style: "green" },
            { type: "stroke", width: 10, style: "blue" },
          ],
          afterClipOperates: [
            { type: "stroke", width: 10, style: "yellow" },
          ]
        }
      },
    })
    hookRect({
      x: 500,
      y: 500,
      onPointerDown(e) {
        console.log("inPath", e.inPath, 'inStroke', e.inStroke)
      },
      draw(ctx) {
        const path = new Path2D()
        path.rect(0, 0, 300, 300)
        // path.ellipse(0, 0, 500, 500, 0, 0, 0)
        return {
          path,
          operates: [
            {
              type: "stroke",
              width: 10,
              style: "red"
            },
            // {
            //   type: "fill",
            //   style: "green"
            // },
            // { type: "clip" },
            // {
            //   type: "stroke",
            //   width: 10,
            //   style: "blue"
            // },
            // {
            //   type: "fill",
            //   style: "orange"
            // },
            // { type: "clip" },
            // {
            //   type: "stroke",
            //   width: 10,
            //   style: "yellow"
            // },
          ]
        }
      },
    })
  })
}