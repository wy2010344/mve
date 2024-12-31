import { dom, renderDom } from "mve-dom";
import { renderArray } from "mve-helper";
import { cssMap } from "wy-dom-helper";
import { arrayCountCreateWith, createSignal, quote } from "wy-helper";

export default function () {

  const list = createSignal(arrayCountCreateWith(15, quote))
  dom.div({
    style: `
    
      height: 400px;
      border: 5px solid black;
      position: absolute;
      top: 20px;
      left: 20px;
      overflow: hidden;
      font-family: sans-serif;
      cursor: default;
    `
  }).render(() => {
    dom.div({
      style: `
  background: white;
  width: 100%;
  transform-origin: left top;
  transform: translateZ(0);
  `
    }).render(() => {

      renderDom("div", {
        className: "refresh",
        childrenType: "text",
        children: "Pull to Refresh"
      })

      renderArray(list.get, (v, i) => {
        console.log("ddv", v, i)
        return v
      }, function (value, getIndex) {
        console.log("ss", value, getIndex)

        dom.div({
          className: s.row,
          style: {
            backgroundColor() {

              return getIndex() % 2 ? "#ddd" : ""
            }
          }
        }).render()
        // renderDom("div", {
        //   className: s.row,
        //   s_backgroundColor() {
        //     return get().index % 2 ? "#ddd" : ""
        //   }
        // })
      })
    })
  })
}

const s = cssMap({
  row: `
        height: 50px;
        width: 100%;
        display: block;
        text-align: left;
        font-size: 20px;
        line-height: 50px;
        text-indent: 10px;
        `
})