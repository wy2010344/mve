import { dom, renderDom } from "mve-dom";
import { hookTrackSignal, renderArray } from "mve-helper";
import { cns, cssMap } from "wy-dom-helper";
import { arrayCountCreateWith, batchSignalEnd, createSignal, quote, scrollerSignal } from "wy-helper";
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

    function getClient() {
      var rect = container.getBoundingClientRect();
      return {
        left: rect.left + container.clientLeft,
        top: rect.top + container.clientTop
      }
    }
    const { left, top, zoomLevel, doTouchStart, finishPullToRefresh, doMouseZoom } = scrollerSignal({
      // clientLeft() {
      //   return rect.left + container.clientLeft
      // },
      // clientTop() {
      //   return rect.top + container.clientTop
      // },
      scrollingX: false,
      zooming: true,
      clientWidth() {
        return container.clientWidth
      },
      clientHeight() {
        return container.clientHeight
      },
      contentWidth() {
        return content.offsetWidth
      },
      contentHeight() {
        return content.offsetHeight - 50
      }
    }, requestAnimationFrame)
    hookTrackSignal(() => {
      content.style.transform = 'translate3d(' + (-left()) + 'px,' + (-top()) + 'px,0) scale(' + zoomLevel() + ')';
    })
    document.addEventListener("touchmove", e => {
      e.preventDefault()
    }, {
      passive: false
    })
    container.addEventListener("pointerdown", e => {
      const m = doTouchStart([e], e.timeStamp, {
        refresh: {
          height: 50,
          start() {
            placeState.set("running")
            setTimeout(function () {
              list.set([Date.now()].concat(list.get()))
              finishPullToRefresh();
            }, 2000);
          },
          activate() {
            placeState.set("active")
          },
          deactivate() {
            placeState.set(undefined)
          }
        }
      })

      const destroyMove = 'ontouchmove' in document
        ? subscribeEventListener(document, 'touchmove', e => {
          m.doTouchMove(e.touches, e.timeStamp)
          batchSignalEnd()
        }, {
          passive: false
        })
        : subscribeEventListener(document, 'pointermove', e => {
          m.doTouchMove([e], e.timeStamp)
        })
      const destroyUp = subscribeEventListener(document, 'pointerup', e => {
        m.doTouchEnd(e.timeStamp)
        destroyMove()
        destroyUp()
      })
    })
    container.addEventListener(
      navigator.userAgent.indexOf("Firefox") > -1
        ? "DOMMouseScroll"
        : "mousewheel",
      function (e: any) {
        const c = getClient()
        doMouseZoom(
          e.detail ? e.detail * -120 : e.wheelDelta,
          e.pageX - c.left,
          e.pageY - c.top
        );
      },
      false
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

// 定义 subscribeEventListener 函数
function subscribeEventListener<
  T extends EventTarget,
  K extends keyof EventMap<T>
>(
  target: T,
  type: K,
  listener: (event: EventMap<T>[K]) => void,
  options?: boolean | AddEventListenerOptions
) {
  target.addEventListener(type as any, listener as EventListener, options);
  return function () {
    target.removeEventListener(type as any, listener as EventListener, options);
  }
}

// 获取特定目标的事件映射表
type EventMap<T> = T extends Document
  ? DocumentEventMap
  : T extends HTMLElement
  ? HTMLElementEventMap
  : T extends SVGSVGElement
  ? SVGElementEventMap
  : T extends Window
  ? WindowEventMap
  : Record<string, Event>; // 默认返回通用 Event 类型