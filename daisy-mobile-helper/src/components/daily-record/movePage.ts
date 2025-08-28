import { AnimateSignal } from "wy-helper"




/**
 * 在内容区内粘浮,超出内容区滚动
 * @param trans 
 * @param maxScrllHeight 最大滚动距离
 * @returns 
 */
export function transSticky(trans: AnimateSignal, maxScrllHeight = 0) {
  let ty = Math.max(trans.get(), 0)
  if (maxScrllHeight) {
    ty = Math.min(ty, maxScrllHeight)
  }
  return ty
}