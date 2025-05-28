import { EmptyFun, removeEqual } from "wy-helper"

const closeList: EmptyFun[] = []
window.addEventListener("popstate", function () {
  const last = closeList.pop()
  last?.()
})

export function fakeRoute(callback: EmptyFun) {
  let isOpen = true
  closeList.push(closeIt)
  /**
   * 关闭
   * @returns 是否成功关闭
   */
  function closeIt() {
    if (isOpen) {
      isOpen = false
      removeEqual(closeList, closeIt)
      callback()
      return true
    }
    return false
  }
  return closeIt
}