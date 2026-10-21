import { purifyList as purifyNodeList, renderRoot } from '../src/index'
import type { ShareConfig, StateHolderWithNode } from '../src/index'

/**
 * core 层不依赖真实 DOM:节点与产物都是字符串/字符串数组,
 * 只要能跑通 buildChildren → target memo → destroy 的完整生命周期即可。
 */
export type TestNode = string
export type TestTarget = string[]

export const testConfig: ShareConfig<TestNode, TestTarget> = {
  after() {},
  purifyList(nodes) {
    const list: TestNode[] = []
    purifyNodeList(nodes, list, () => false)
    return list
  },
}

export function createTestRoot(
  callback: (this: StateHolderWithNode<TestNode, TestTarget>) => void
) {
  return renderRoot('root', testConfig, callback)
}
