import { hookAbsolute, renderAbsoulte } from "./absoluteRender";

export default function (app: HTMLElement) {
  renderAbsoulte(app, () => {
    hookAbsolute({
      type: "div",
      x: 30,
      y: 20,
      width: 300,
      height: 200,

      css_dddd: 89,
      onClick() {

      },
      onClickCapture() {

      }
    })
  })
}