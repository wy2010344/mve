import { dom } from "mve-dom";
import { hookDestroy, hookTrackSignal, renderArray, renderIf } from "mve-helper";
import { createSignal, emptyArray, emptyFun, StoreRef } from "wy-helper";

export default function () {

  renderList()
}


type TreeModel = {
  id: number
  text: string
}

function treeItem(item: TreeModel, onDelete: () => void) {
  const edit = createSignal(false)
  dom.div({
    style: `
    margin-left:20px;
    `
  }).render(() => {
    dom.div().render(() => {
      let input: HTMLInputElement
      renderIf(edit.get, () => {
        input = dom.input({
        }).render()
        hookDestroy(() => {
          console.log("销毁...", item.get().text)
        })
        hookTrackSignal(() => {
          input.value = item.get().text
        }, emptyFun)
      }, () => {
        dom.span().renderTextContent(() => item.get().text)
      })
      dom.button({
        onClick() {
          if (edit.get()) {
            const value = input.value.trim()
            if (value) {
              item.set({
                ...item.get(),
                text: value
              })
            } else {
              onDelete()
            }
          }
          edit.set(!edit.get())
        }
      }).renderTextContent(() => {
        if (edit.get()) {
          return '确认'
        } else {
          return '编辑'
        }
      })
      dom.button({
        onClick: onDelete
      }).renderText`删除`
    })
    renderList()
  })
}

function renderList() {
  const list = createSignal<TreeModel[]>(emptyArray as any[])
  renderArray(list.get, (get) => {
    treeItem({
      get() {
        return get().item
      },
      set(v) {
        const vs = list.get().slice()
        vs[get().index] = v
        list.set(vs)
      },
    }, () => {
      const vs = list.get().slice()
      vs.splice(get().index, 1)
      list.set(vs)
    })
  })

  dom.div({
    style: `
    margin-left:20px;
    `
  }).render(() => {

    const input = dom.input({
      placeholder: "..."
    }).render()
    dom.button({
      onClick() {
        const value = input.value.trim()
        if (value) {
          list.set(list.get().concat({
            id: Date.now(),
            text: value
          }))
          input.value = ''
        }
      }
    }).renderText`增加`
  })
}