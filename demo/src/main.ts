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
const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = createRoot(app, () => {
  // changePortal()
  canvas()
  // konvaDemo()
  // observer()
  // demo1()
  // tree()
  // absoluteDemo(app)
  // clipDemo()
  // magnifiedDock()
})


window.addEventListener("unload", destroy)