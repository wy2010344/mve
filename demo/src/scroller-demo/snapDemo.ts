import { dom } from "mve-dom";
import { renderArray } from "mve-helper";
import { arrayCountCreateWith, quote } from "wy-helper";
import { Scroller } from "../scroller";

export default function () {
  dom.div({
    style: `
    
		width: 700px;
		height: 400px;
		border: 5px solid black;
		position: absolute;
		top: 20px;
		left: 20px;
		overflow: hidden;
		
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-o-user-select: none;
		user-select: none;
    `
  }).render((container) => {
    const content = dom.div({
      style: `
      
		background: white;
		width: 4000px;
		height: 2000px;
		
		-webkit-transform-origin: left top;
		-webkit-transform: translateZ(0);
		-moz-transform-origin: left top;
		-moz-transform: translateZ(0);
		-ms-transform-origin: left top;
		-ms-transform: translateZ(0);
		-o-transform-origin: left top;
		-o-transform: translateZ(0);
		transform-origin: left top;
		transform: translateZ(0);
      `
    }).render(() => {
      renderArray(() => arrayCountCreateWith(48, quote), function (value, getIndex) {

        dom.div({
          style() {
            return `
		width: 100px;
		height: 100px;
		display: inline-block;
		text-align: center;
		line-height: 100px;
    background-color:${getIndex() % 2 ? "#ddd" : "#fff"};
          `
          }
        }).renderText`${value}`

      })
    })
    // Initialize Scroller
    var scroller = new Scroller((left, top, zoom) => {
      content.style.transform = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
    }, {
      snapping: true
    });


    // Setup Scroller

    const ob = new ResizeObserver(() => {
      console.log("in")
      var rect = container.getBoundingClientRect();
      scroller.setSnapSize(100, 100);
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