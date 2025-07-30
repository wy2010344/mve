import { fdom, FPDomAttributes, renderChildren } from "mve-dom";
import { Branch, BranchLoader, BranchLoaderParam, getBranchKey, getExitAnimateArray, hookTrackSignal, renderArray, renderArrayKey, renderIf } from "mve-helper";
import { addEffect, GetValue, getValueOrGet, memo, objectMap, ScrollFromPage, SetValue, tw, ValueOrGet } from "wy-helper";
import { animate, AnimationOptions, CSSStyleDeclarationWithTransform, number, ValueKeyframe } from "motion";
import { PageDirection } from "./hookPage";
import { routerConsume } from "mve-dom-helper/history";
import { cns, movePage } from "mve-dom-helper";
import { createContext } from "mve-core";
import { pointerMoveDir } from "wy-dom-helper";

type CSSStyleDeclarationWithTransformKey = keyof CSSStyleDeclarationWithTransform

export type CSSStyleDeclarationSingle = {
  [K in CSSStyleDeclarationWithTransformKey]?: ValueKeyframe
}

export interface LayoutCssConfig<T extends CSSStyleDeclarationSingle> {
  init: T,
  animate: T
  exit: T
  config?: AnimationOptions
}

const defaultConfig: LayoutCssConfig<{
  x: ValueKeyframe
}> = {
  init: {
    x: '100%'
  },
  animate: {
    x: 0
  },
  exit: {
    x: '-100%'
  }
}

const defAnimateConfig: AnimationOptions = {
  type: "tween",
  // duration: 10
}
export function renderLayoutPage<T extends CSSStyleDeclarationSingle = {
  x: ValueKeyframe
}>(
  getBranch: GetValue<Branch>,
  renderBranch: SetValue<GetValue<Branch>>,
  getDirection: GetValue<PageDirection | undefined>,
  getConfig: ValueOrGet<LayoutCssConfig<T>> = defaultConfig as any
) {
  renderArray(
    getExitAnimateArray(
      () => [getBranch()],
      {
        getKey: getBranchKey,
        enterIgnore(v: any, inited: any) {
          return !inited
        }
      }
    ),
    function (get) {
      let node: HTMLDivElement
      renderIf(() => get.step() == 'enter', function () {
        node = fdom.div({
          className: 'absolute inset-0',
          willRemove(node) {
            return get.promise()
          },
          children() {
            renderBranch(get.value)
          }
        })
      })
      hookTrackSignal(get.step, step => {
        if (step == 'enter' && !get.enterIgnore) {
          addEffect(() => {
            const direction = getDirection()
            if (!direction) {
              get.resolve()
              return
            }
            const config = getValueOrGet(getConfig)
            const animateConfig = config.config || defAnimateConfig

            const from = direction == 'toRight' ? config.init : config.exit
            animate(node, objectMap(config.animate as {}, function (value, key) {
              return [from[key as CSSStyleDeclarationWithTransformKey], value]
            }), animateConfig).then(get.resolve);
          })
        }
        if (step == 'exiting') {
          addEffect(() => {
            const direction = getDirection()
            if (!direction) {
              get.resolve()
              return
            }
            const config = getValueOrGet(getConfig)
            const animateConfig = config.config || defAnimateConfig

            const to = direction == 'toRight' ? config.exit : config.init
            animate(node, objectMap(config.animate as {}, function (value, key) {
              return [value, to[key as CSSStyleDeclarationWithTransformKey]]
            }), animateConfig).then(get.resolve)
          })
        }
      })
    }
  )
}




export type MovePageArg<T> = {
  key: T
}
export type MovePageGet<T> = {
  before?: MovePageArg<T>
  current: MovePageArg<T>
  after?: MovePageArg<T>
}
export function renderMovePage<T>({

  renderChildren,
  get,
}: {
  get: GetValue<MovePageGet<T>>
  renderChildren(key: T, getClassName: GetValue<string>): void
}) {
  renderArrayKey(() => {
    const o = get()
    const list: {
      key: any,
      step?: 'before' | 'after'
    }[] = []
    if (o.before) {
      list.push({
        key: o.before.key,
        step: 'before'
      })
    }
    list.push({
      key: o.current.key
    })
    if (o.after) {
      list.push({
        key: o.after.key,
        step: 'after'
      })
    }
    return list
  }, v => v.key, function (getValue, getIndex, key) {

    renderChildren(key, function () {
      const n = getValue()
      if (n.step == 'before') {
        return tw`absolute top-0 w-full h-full right-full`
      }
      if (n.step == 'after') {
        return tw`absolute top-0 w-full h-full left-full `
      }
      return ''
    })
  })
}


export type ParentMoveCtxParam = {
  left?(e: PointerEvent): void | ScrollFromPage<PointerEvent>
  right?(e: PointerEvent): void | ScrollFromPage<PointerEvent>
}

const ParentMoveCtx = createContext<ParentMoveCtxParam>(undefined!)
export function moveProvide(arg: ParentMoveCtxParam) {
  const old = ParentMoveCtx.consume()
  ParentMoveCtx.provide({
    ...old,
    ...arg
  })
}
export const moveConsume = ParentMoveCtx.consume.bind(ParentMoveCtx)
export function renderTabLink(
  e: BranchLoaderParam,
  tabs: {
    href: string
  }[],
  findTabIndex: (n: string) => number,
  attrs: FPDomAttributes<'div'>
) {
  const { getHistoryState, router } = routerConsume()
  const currentIndex = memo(() => {
    const pathname = getHistoryState().pathname
    return findTabIndex(pathname)
  })
  const scrollX = movePage({
    getSize() {
      return container.clientWidth
    }
  })
  function baseMove(e: PointerEvent) {
    return scrollX.getMoveEvent(e, 'x', {
      callback(direction, velocity) {
        const newItem = tabs[currentIndex() + direction]
        if (newItem) {
          router.replace(newItem.href)
          return false
        }
        return true
      },
    })
  }
  const container = fdom.div({
    ...attrs,
    className: cns('relative overflow-hidden', attrs.className),
    children() {
      scrollX.hookCompare(currentIndex, function (a, b) {
        return a - b
      })
      const parentMove = ParentMoveCtx.consume()
      fdom.div({
        s_transform() {
          return `translateX(${-scrollX.get()}px)`
        },
        children() {
          renderMovePage({
            get() {
              const i = currentIndex()
              const o: MovePageGet<number> = {
                current: {
                  key: i
                }
              }
              const b = i - 1
              if (tabs[b]) {
                o.before = {
                  key: b
                }
              }
              const af = i + 1
              if (tabs[af]) {
                o.after = {
                  key: af
                }
              }
              return o
            },
            renderChildren(key, getClassName) {
              function moveLeft(e: PointerEvent) {
                if (key == 0) {
                  return parentMove?.left?.(e)
                }
                return baseMove(e)
              }
              function moveRight(e: PointerEvent) {
                if (key == tabs.length - 1) {
                  return parentMove?.right?.(e)
                }
                return baseMove(e)
              }
              let onDrag = false
              function move(e: PointerEvent) {
                pointerMoveDir(e, {
                  element: container,
                  onDragChange(v) {
                    onDrag = v
                  },
                  onMove(e, dir, va) {
                    if (dir == 'x') {
                      if (va.x > 0) {
                        return moveLeft(e)
                      } else {
                        return moveRight(e)
                      }
                    }
                  }
                })
              }
              ParentMoveCtx.provide({
                left: moveLeft,
                right: moveRight
              })

              fdom.div({
                className: getClassName,
                onPointerDown(e) {
                  if (scrollX.onAnimation()) {
                    return
                  }
                  e.stopPropagation()
                  move(e)
                },
                onTouchMove(e) {
                  if (onDrag) {
                    e.preventDefault()
                  }
                },
                children() {
                  if (key == currentIndex()) {
                    e.renderBranch(e.getChildren)
                  } else {
                    e.renderBranch(() => e.load(tabs[key].href, true))
                  }
                }
              })
            },
          })
        }
      })
    }
  })
}