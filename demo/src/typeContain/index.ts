import { hookAddDestroy } from "mve-core";
import { renderDom } from "mve-dom";
import { renderCode, renderContentEditable } from "mve-dom-helper";
import { hookTrackSignalMemo, renderOne } from "mve-helper";
import { contentEditableText, initContentEditableModel } from "wy-dom-helper/contentEditable";
import { addEffect, batchSignalEnd, createSignal, emptyFun, memo } from "wy-helper";
import { parseSentence } from "wy-helper/infixLang";
import { getCurrentQue, runParse, success } from "wy-helper/tokenParser";

export default function () {
  renderDom("div", {
    className: "flex",
    children() {
      renderInputArea("A1")
      renderInputArea("A2")
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


  hookTrackSignalMemo(() => {
    localStorage.setItem(saveKey, current().value)
  }, emptyFun)
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
  // const pout=memo(()=>{
  //   try {
  //     const out = runParse(current().value, parseSentence)
  //     const vx = checkEval(out, topScope)
  //     // console.log("dd", debugLog(out), vx)
  //     const v = success(out, getCurrentQue() as Que)
  //     const list = toTree(out, text)
  //     return {
  //       value: list,
  //       out: v,
  //     } as any
  //   } catch (err) {
  //     console.log("dd", err)
  //     return {
  //       value: [
  //         {
  //           type: "white",
  //           messages: [],
  //           value: text
  //         }
  //       ],
  //       out: err
  //     }
  //   } 
  // })
}