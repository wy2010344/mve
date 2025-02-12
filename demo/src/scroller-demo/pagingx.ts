import { dom } from "mve-dom";
import { renderArray } from "mve-helper";
import { arrayCountCreateWith, createSignal, quote } from "wy-helper";
// import Scroller from 'scroller'
import { Scroller } from "../scroller";

export default function () {

  const scale = createSignal(0)

  dom.div({
    style: `
		width: 300px;
		height: 300px;
		border: 5px solid black;
		position: absolute;
		top: 20px;
		left: 20px;
		overflow: hidden;
		user-select: none;
        box-sizing: content-box;
    `
  }).render((container) => {
    const content = dom.div({
      style: `
		background: white;
    width:fit-content;
		height: 300px;
		white-space: nowrap;
		transform-origin: left top;
		transform: translateZ(0);
      `
    }).render(() => {
      renderArray(() => arrayCountCreateWith(48, quote), function (value, getIndex) {

        dom.div({
          style() {
            return `
          	width: 300px;
		line-height: 300px;
		display: inline-block;
		text-align: center;
		font-family: sans-serif;
		font-size: 50px;
    background-color:${getIndex() % 2 ? "#ddd" : "#fff"};
          `
          }
        }).renderText`${value} ${scale.get}`
      })
    })
    // Initialize Scroller
    var scroller = new Scroller((left, top, zoom) => {
      content.style.transform = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
    }, {
      scrollingY: false,
      paging: true
    });


    // Setup Scroller

    const ob = new ResizeObserver(() => {
      var rect = container.getBoundingClientRect();
      scroller.setPosition(rect.left + container.clientLeft, rect.top + container.clientTop);
      // Update Scroller dimensions for changed content
      scroller.setDimensions(
        container.clientWidth,
        container.clientHeight,
        content.offsetWidth,
        content.offsetHeight
      );
    })
    ob.observe(content)
    container.addEventListener("pointerdown", e => {
      e.preventDefault()
      scroller.doTouchStart([e], e.timeStamp)
    })
    if ('ontouchmove' in document) {
      document.addEventListener("touchmove", e => {
        // scale.set(e.scale)
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
  })
}