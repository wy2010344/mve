import { renderAbsoulte, renderADom } from "./absoluteRender";

export default function (app: HTMLElement) {
  renderAbsoulte(app, () => {
    renderADom("div", {
      x: 30,
      y: 20,
      width: 300,
      height: 200,
      css_dddd: 89,
      data_abc: "abc",
      aria_hidden: true,
      onClick() {

      },
      onClickCapture() {

      }
    })
  })
}