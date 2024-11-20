import { EmptyFun, run } from 'wy-helper'
import { hookAlterStateHolder } from './cache'
import { StateHolder } from './stateHolder'

export * from './renderForEach'
export {
  hookAddDestroy,
  hookAddResult,
  hookAlterChildren
} from './cache'
export { createContext } from './context'

export function render(create: EmptyFun) {
  const stateHolder = new StateHolder()
  hookAlterStateHolder(stateHolder)
  create()
  hookAlterStateHolder(undefined)
  return () => {
    stateHolder.destroy()
  }
}