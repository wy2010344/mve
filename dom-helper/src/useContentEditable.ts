import { hookTrackSignal, renderOne } from "mve-helper";
import { ContentEditableModel, EditRecord, fixScroll, getCurrentEditRecord } from "wy-dom-helper/contentEditable";
import { addEffect, emptyFun, GetValue, ValueOrGet, valueOrGetToGet } from "wy-helper";


export function useContentEditable(getValue: GetValue<ContentEditableModel>) {
  function current() {
    const v = getValue()
    return getCurrentEditRecord(v)
  }
  return {
    current,
    renderContentEditable({
      noFocus,
      children
    }: {
      noFocus?: ValueOrGet<boolean>
      children(value: string): HTMLElement
    }) {
      const nF = valueOrGetToGet(noFocus)
      renderOne(() => current().value, function (value) {
        const div = children(value)
        hookTrackSignal(() => {
          if (nF()) {
            return
          }
          addEffect(() => {
            fixScroll(div, current())
          })
        }, emptyFun)
      })
    }
  }
}