import { hookTrackSignalMemo, renderOne } from "mve-helper";
import { ContentEditableModel, EditRecord, fixScroll } from "wy-dom-helper/contentEditable";
import { emptyFun, GetValue, ValueOrGet, valueOrGetToGet } from "wy-helper";


export function redo(model: ContentEditableModel) {
  const ndx = model.currentIndex + 1
  if (ndx < model.history.length) {
    model.currentIndex = ndx
  }
  return model
}

export function undo(model: ContentEditableModel) {
  if (model.currentIndex) {
    model.currentIndex--
  }
  return model
}

export function reset(model: ContentEditableModel, record: EditRecord) {
  model.currentIndex = 0
  model.history.length = 0
  model.history.push(record)
  return model
}


export function useContentEditable(getValue: GetValue<ContentEditableModel>) {
  function current() {
    const v = getValue()
    return v.history[v.currentIndex]
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
        hookTrackSignalMemo(() => {
          if (nF()) {
            return
          }
          fixScroll(div, current())
        }, emptyFun)
      })
    }
  }
}