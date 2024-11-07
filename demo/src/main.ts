import { createRoot } from 'mve-dom'
import demo1 from './demo1'
import magnifiedDock from './magnified-dock'
const app = document.querySelector<HTMLDivElement>('#app')!

const destroy = createRoot(app, () => {
  // demo1()
  magnifiedDock()
})


window.addEventListener("unload", destroy)