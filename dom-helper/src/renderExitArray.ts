import { hookAddResult } from "mve-core"
import { ExitModel, renderArray, renderIf } from "mve-helper"
import { GetValue } from "wy-helper"
export type ExitArrayCloneOut<T extends Node> = {
  node: T,
  applyAnimate(node: T): void
}
export type ExitArrayCloneOutList = ExitArrayCloneOut<Node> | {
  call?(): void
  list: readonly ExitArrayCloneOut<Node>[]
}
export function renderExitArrayClone<T>(
  get: GetValue<readonly ExitModel<T>[]>,
  render: (row: ExitModel<T>, getIndex: GetValue<number>) => ExitArrayCloneOutList
) {
  renderArray(get, (row, getIndex) => {
    let out!: ExitArrayCloneOutList
    renderIf(row.exiting, () => {
      if ('node' in out) {
        const cloneNode = out.node.cloneNode(true)
        hookAddResult(cloneNode)
        out.applyAnimate(cloneNode)
      } else {
        out.call?.()
        out.list.forEach(row => {
          const cloneNode = row.node.cloneNode(true)
          hookAddResult(cloneNode)
          row.applyAnimate(cloneNode)
        })
      }
    }, () => {
      out = render(row, getIndex)
    })
  })
}