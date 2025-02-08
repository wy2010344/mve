import { createRoot } from 'mve-dom'
import demo1 from './demo1'
import magnifiedDock from './magnified-dock'
import observer from './oberver'
import konvaDemo from './konva-demo'
import canvas from './canvas'
import changePortal from './changePortal'
import clipDemo from './clipDemo'
import tree from './tree'
import absoluteDemo from './absoluteDemo'
import canvas2 from './canvasDemo'
import typeContain from './typeContain'
import three from './three'
import scrollDemo1 from './scroller-demo/demo1'
import scrollDemo1p from './scroller-demo/demo1p'
import pagingx from './scroller-demo/pagingx'
import snapDemo from './scroller-demo/snapDemo'
import scrollerDemo1 from './demos/scrollerDemo1'
import reorderDemo from './demos/reorderDemo'
import forceDemo from './d3/force/demo1'
import forceDemo2 from './d3/force/demo2'
import forceDemo3 from './d3/force/demo3'
import forceDemo4 from './d3/force/demo4'
import exitAnimate from './exitAnimate'
import demo2 from './demos/demo2'
import calendar from './demos/calendar'
const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = createRoot(app, () => {
  calendar()
  // demo2()
  // scrollerDemo1()
  // reorderDemo()
  // changePortal()
  // canvas()
  // canvas2()
  // exitAnimate()
  // scrollDemo1()
  // scrollDemo1p()
  // pagingx()
  // snapDemo()
  // konvaDemo()
  // observer()
  // demo1()
  // typeContain()
  // tree()
  // absoluteDemo(app)
  // three()
  // clipDemo()
  // magnifiedDock()
  // forceDemo()
  // forceDemo2()
  // forceDemo3()
  // forceDemo4()
})


window.addEventListener("unload", destroy)