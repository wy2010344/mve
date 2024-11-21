import { createRoot } from 'mve-dom'
import demo1 from './demo1'
import magnifiedDock from './magnified-dock'
import observer from './oberver'
import konvaDemo from './konva-demo'
import canvas from './canvas'
import changePortal from './changePortal'
const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = createRoot(app, () => {
  // changePortal()
  canvas()
  // konvaDemo()
  // observer()
  // demo1()
  // magnifiedDock()
})


window.addEventListener("unload", destroy)