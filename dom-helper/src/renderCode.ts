import { StoreRef, ValueOrGet } from "wy-helper";
import { redo, undo, useContentEditable } from "./useContentEditable";
import { appendRecord, contentDelete, ContentEditableModel, contentEnter, contentTab, getCurrentRecord, mb } from "wy-dom-helper/contentEditable";
import { React } from "wy-dom-helper";


export function renderCode(model: StoreRef<ContentEditableModel>
) {
  const { current, renderContentEditable } = useContentEditable(model.get)
  return {
    current,
    renderContentEditable<T extends HTMLElement>({
      noFocus,
      render
    }: {
      noFocus?: ValueOrGet<boolean>
      render(value: string, a: {
        onInput(e: React.FormEvent): void
        onCompositionEnd(): void
        onKeyDown(e: React.KeyboardEvent<T>): void
      }): T
    }) {
      renderContentEditable({
        noFocus,
        children(value) {
          const div = render(value, {
            onInput(event: React.FormEvent) {
              if (event.isComposing) {
                return
              }
              model.set(appendRecord(model.get(), getCurrentRecord(div)))
            },
            onCompositionEnd() {
              model.set(appendRecord(model.get(), getCurrentRecord(div)))
            },
            onKeyDown(e: React.KeyboardEvent<T>) {
              if (mb.DOM.keyCode.TAB(e)) {
                e.preventDefault()
                const record = contentTab(div, e.shiftKey)
                if (record) {
                  model.set(appendRecord(model.get(), record))
                }
              } else if (mb.DOM.keyCode.ENTER(e)) {
                e.preventDefault()
                const record = contentEnter(div)
                model.set(appendRecord(model.get(), record))
              } else if (mb.DOM.keyCode.Z(e)) {
                if (isCtrl(e)) {
                  if (e.shiftKey) {
                    //redo
                    e.preventDefault()
                    model.set(redo(model.get()))
                  } else {
                    //undo
                    e.preventDefault()
                    model.set(undo(model.get()))
                  }
                }
              } else if (mb.DOM.keyCode.BACKSPACE(e)) {
                e.preventDefault()
                const record = contentDelete(div)
                if (record) {
                  model.set(appendRecord(model.get(), record))
                }
              }
            }
          })
          return div
        },
      })
    }
  }
}
function isCtrl(e: React.KeyboardEvent) {
  return e.metaKey || e.ctrlKey
}
