import { PairBranch, PairLeaf, PairNode, PairNotfound, TreeRoute } from "wy-helper/router"
import { renderOne, renderOneKey } from "./renderIf"
import { EmptyFun, emptyObject, GetValue, memo, PromiseResult, quote, SetValue } from "wy-helper"
import { promiseSignal } from "./renderPromise"
import { renderArray, renderArrayKey } from "./renderMap"

export type BranchOrLeaf = PairBranch<BranchLoader, LeafLoader, NotfoundLoader> | PairLeaf<LeafLoader> | PairNotfound<NotfoundLoader>


export type BranchLoader = {
  default(arg: GetValue<Record<string, any>>, getBranch: GetValue<Branch>): void
}
export type LeafLoader = {
  default(arg: GetValue<Record<string, any>>): void
}
export type NotfoundLoader = {
  default(arg: GetValue<Record<string, any>>, rest: GetValue<string[]>): void
}

export type BranchAll = PairNode<BranchLoader, LeafLoader, NotfoundLoader>


export type Branch = BranchOrLeaf | {
  type: "error",
  value: any
  loader?: never
  query?: never
  next?: never
  nodes?: string[]
  index?: number
  load?: never
  // restNodes?: never
}
type BrancToList = (beforeBranch: Branch, branch: Branch) => Branch[]
export function getBranchKey(n: Branch) {
  return n?.loader
}

export function createTreeRoute({
  treeArg = emptyObject,
  pages,
  prefix,
  renderError
}: {
  treeArg?: Record<string, (n: string) => any>
  pages: Record<string, any>
  prefix: string
  renderError?: SetValue<any>
}) {
  const tree = new TreeRoute<BranchLoader, LeafLoader, NotfoundLoader>(treeArg)
  tree.buildFromMap(pages, prefix)
  tree.finishBuild()
  //渲染某一个分支,不考虑key

  const map = new Map()
  function loaderCache<T>(loader: GetValue<Promise<T>>) {
    if (map.has(loader)) {
      return map.get(loader)
    }
    const { get } = promiseSignal(loader())
    map.set(loader, get)
    return get
  }
  function preLoad(path: string) {
    const pathNodes = path.split('/').filter(quote)
    let out: BranchOrLeaf | undefined = tree.matchNodes(pathNodes)
    while (out) {
      loaderCache(out.loader as any)
      out = out.next
    }
  }
  function renderBranch(
    getBranch: GetValue<Branch>
  ) {
    const branch = getBranch()
    const loader = branch.loader
    if (!loader) {
      renderError?.((branch as any).value)
      return
    }
    const get = loaderCache(loader as any)
    renderOne(get, function (value?: PromiseResult<any>) {
      if (value?.type == 'success') {
        if (branch.type == 'branch') {
          value.value.default(
            () => getBranch().query,
            () => getBranch().next!,
            (path: string) => {
              const nodes = path.split('/').filter(quote)
              return getBranch().load!(nodes)
            })
        } else if (branch.type == 'leaf') {
          value.value.default(() => getBranch().query)
        } else if (branch.type == 'notfound') {
          value.value.default(() => getBranch().query, () => getBranch().nodes)
        }
      } else if (value?.type == 'error') {
        renderError?.(value.value)
      } else {
        //loading状态
      }
    })
  }
  return {
    preLoad,
    renderBranch,
    getBranch(getPath: GetValue<string>) {
      return memo(() => {
        try {
          const nodes = getPath().split('/').filter(quote)
          const out = tree.matchNodes(nodes)
          return out
        } catch (err) {
          return {
            type: "error",
            value: err
          } as const
        }
      })
    }
  }
}


export const argForceNumber = function (n: string) {
  if (!n) {
    throw new Error('不允许省略')
  }
  const x = Number(n)
  if (isNaN(x)) {
    throw new Error('not a number ' + n)
  }
  return x
}