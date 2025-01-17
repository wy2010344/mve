import { hookAddResult } from "mve-core"
import { ExitModel, hookTrackSignal, renderArray, renderIf, renderOne } from "mve-helper"
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
    renderIf(() => {
      const state = row.step()
      return state == 'exiting' || state == 'will-exiting'
    }, () => {
      if ('node' in out) {
        applyOne(out, row)
      } else {
        out.call?.()
        out.list.forEach(item => {
          applyOne(item, row)
        })
      }
    }, () => {
      out = render(row, getIndex)
    })
  })
}

function applyOne(out: ExitArrayCloneOut<any>, row: ExitModel<any>) {
  const cloneNode = out.node.cloneNode(true)
  hookAddResult(cloneNode)
  const applyAnimate = out.applyAnimate
  hookTrackSignal(row.step, step => {
    if (step == 'exiting') {
      //exiting时,promise才更新成最新的Promise
      applyAnimate(cloneNode)
    }
  })
}