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
const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = createRoot(app, () => {
  scrollerDemo1()
  // changePortal()
  // canvas()
  // canvas2()
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
})


window.addEventListener("unload", destroy)