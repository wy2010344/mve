import { EmptyFun, run } from 'wy-helper'
import { hookAlterDestroyList } from './cache'

export * from './renderForEach'
export {
  hookAddDestroy,
  hookAddResult,
  hookAlterChildren
} from './cache'

export function render(create: EmptyFun) {
  const list: EmptyFun[] = []
  hookAlterDestroyList(list)
  create()
  hookAlterDestroyList(undefined)
  return () => {
    list.forEach(run)
  }
}