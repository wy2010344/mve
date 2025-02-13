import { createRoot } from 'mve-dom'
import todoDemo from './todo-demo'
const app = document.querySelector<HTMLDivElement>('#app')!
const destroy = createRoot(app, () => {
  //业务代码放在这里
  todoDemo()
})
window.addEventListener("unload", destroy)