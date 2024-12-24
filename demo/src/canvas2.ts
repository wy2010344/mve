import { hookAddDestroy } from "mve-core";
import { renderDom } from "mve-dom";
import { drawText, drawTextWrap, hookRect, measureTextWrap, renderCanvas } from "mve-dom-helper";
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
            {
              type: "draw", callback(ctx) {
                drawText(ctx, "abc", "green", {
                  x: 90,
                  y: 90,
                  config: {
                    font: "30px serif"
                  }
                })

                const o = measureTextWrap(ctx, 'My wife was curiously silent throughout the drive, and seemed oppressed with forebodings of evil.  I talked to her reassuringly, pointing out that the Martians were tied to the Pit by sheer heaviness, and at the utmost could but crawl a little out of it; but she answered only in monosyllables.  Had it not been for my promise to the innkeeper, she would, I think, have urged me to stay in Leatherhead that night.  Would that I had!  Her face, I remember, was very white as we parted. For my own part, I had been feverishly excited all day.', {
                  lineHeight: 30,
                  width: 300,
                  maxLines: 4,
                  config: {
                    textBaseline: "hanging"
                  }
                })

                drawTextWrap(ctx, o, 'red', {
                  textAlign: 'right'
                })
              },
            }
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
