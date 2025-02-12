import { renderDom } from "mve-dom";
import { renderCode } from "mve-dom-helper";
import { hookTrackSignal, hookTrackSignal } from "mve-helper";
import { contentEditableText, initContentEditableModel } from "wy-dom-helper/contentEditable";
import { createSignal, emptyFun } from "wy-helper";
import { parseSentence } from "./parse";
import { runParse } from "wy-helper/tokenParser";
import { evalTree } from "./evalTree";

export default function () {
  renderDom("div", {
    className: "flex",
    children() {
      renderInputArea("A1")
      // renderInputArea("A2")
    }
  })
}


function renderInputArea(saveKey: string) {
  const model = createSignal(
    initContentEditableModel(localStorage.getItem(saveKey) || '')
  )
  // const oldSet = model.set
  // model.set = function (v: any) {
  //   oldSet(v)
  //   batchSignalEnd()
  // }
  const { current, renderContentEditable } = renderCode(model)


  hookTrackSignal(() => {
    return current().value
  }, value => {
    localStorage.setItem(saveKey, value)
  })
  renderContentEditable({
    render(value, a) {
      // console.log("创建", value)
      // hookAddDestroy()(() => {
      //   console.log("销毁", value)
      // })
      const div = renderDom("pre", {
        className: "flex-1 min-h-4 whitespace-pre",
        a_contentEditable: contentEditableText,
        ...a,
        a_spellcheck: false,
        children() {
          renderDom("span", {
            childrenType: "text",
            children: value
          })
        }
      })
      return div
    },
  })
  hookTrackSignal(() => {
    try {
      const out = runParse(current().value, parseSentence)
      console.log("out", evalTree(out,))
    } catch (err) {
      console.log("dd", err)
    }
  }, emptyFun)
}