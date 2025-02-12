import { dom, renderDom } from "mve-dom";
import { renderArray } from "mve-helper";
import { cns, cssMap } from "wy-dom-helper";
import { arrayCountCreateWith, createSignal, quote } from "wy-helper";
import { Scroller } from "../scroller";
// import Scroller from 'scroller'
export default function () {
  const list = createSignal(arrayCountCreateWith(150, quote))
  const placeState = createSignal<"active" | "running" | undefined>(undefined)
  dom.div({
    style: `
      width: 300px;
      height: 400px;
      border: 5px solid black;
      position: absolute;
      top: 20px;
      left: 20px;
      overflow: hidden;
      font-family: sans-serif;
      cursor: default;
    `
  }).render((container) => {
    const content = dom.div({
      style: `
  background: white;
  width: 100%;
  transform-origin: left top;
  transform: translateZ(0);
  `
    }).render(() => {
      renderDom("div", {
        className() {
          const x = placeState.get()
          return cns(s.refresh, x)
        },
        childrenType: "text",
        children() {
          const x = placeState.get()
          if (x == 'active') {
            return "Release to Refresh"
          } else if (x == 'running') {
            return "Refreshing..."
          }
          return "Pull to Refresh"
        }
      })
      renderArray(list.get, function (value, getIndex) {
        renderDom("div", {
          className: s.row,
          s_backgroundColor() {
            return getIndex() % 2 ? "#ddd" : ""
          },
          childrenType: "text",
          children: `${value}---${Math.random()}`
        })
      })
    })

    const scroller = new Scroller((left, top, zoom) => {
      content.style.transform = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
    }, {
      scrollingX: false,
    });

    const ob = new ResizeObserver(() => {
      // Update Scroller dimensions for changed content
      scroller.setDimensions(
        container.clientWidth,
        container.clientHeight,
        content.offsetWidth,
        content.offsetHeight - 50
      );
    })
    ob.observe(content)
    // container.addEventListener("touchstart", e => {
    //   e.preventDefault()
    //   scroller.doTouchStart(e.touches, e.timeStamp)
    // }, false)
    // window.addEventListener("touchmove", e => {
    //   e.preventDefault()
    //   scroller.doTouchMove(e.touches, e.timeStamp)
    // }, {
    //   passive: false
    // })
    container.addEventListener("pointerdown", e => {
      e.preventDefault()
      scroller.doTouchStart([e], e.timeStamp)
    })
    // document.addEventListener("pointermove", e => {
    //   e.preventDefault()
    //   scroller.doTouchMove([e], e.timeStamp)
    // })
    if ('ontouchmove' in document) {
      document.addEventListener("touchmove", e => {
        e.preventDefault()
        scroller.doTouchMove(e.touches, e.timeStamp)
      }, {
        passive: false
      })
    } else {
      document.addEventListener("pointermove", e => {
        scroller.doTouchMove([e], e.timeStamp)
      })
    }
    document.addEventListener("pointerup", e => {
      //只有pointerup起效果了,pointercancel,touchup,touchcancel都没有,
      scroller.doTouchEnd(e.timeStamp)
    })
    // Activate pull-to-refresh
    scroller.activatePullToRefresh(
      50,
      function () {
        placeState.set("active")
      },
      function () {
        placeState.set(undefined)
      },
      function () {
        placeState.set("running")
        setTimeout(function () {
          list.set([Date.now()].concat(list.get()))
          scroller.finishPullToRefresh();
        }, 2000);
      }
    );

    // Setup Scroller

    var rect = container.getBoundingClientRect();
    scroller.setPosition(
      rect.left + container.clientLeft,
      rect.top + container.clientTop
    );
  })
}

const s = cssMap({
  row: `
  white-space:nowrap;
        height: 50px;
        width: 100%;
        display: block;
        text-align: left;
        font-size: 20px;
        line-height: 50px;
        text-indent: 10px;
overflow:hidden;
        `,
  refresh: `
        
        
        background: #7b91aa;
        color: white;
        font-weight: bold;
        height: 50px;
        margin-top: -50px;
        text-align: center;
        font-size: 16px;
        line-height: 50px;
      &.active {
        background: #006eb3;
      }

      &.running {
        background: #00b373;
      }
        `
})