import { EmptyFun } from "wy-helper";
import { useReducer } from "./useReducer";


function increase(old: number) {
  return old + 1
}
/**
 * 如果更细化定制,是否是初始化参数,步进?
 * @returns 
 */
export function useVersion(init = 0) {
  return useReducer(increase, init) as [number, EmptyFun]
}


export function getOpposite(old: any) {
  return !old
}

export function useToggle(init?: any) {
  return useReducer(getOpposite, init) as [boolean, EmptyFun]
}