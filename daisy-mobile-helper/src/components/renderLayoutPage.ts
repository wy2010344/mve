import { fdom } from "mve-dom";
import { Branch, getBranchKey, getExitAnimateArray, hookTrackSignal, renderArray, renderIf } from "mve-helper";
import { addEffect, GetValue, getValueOrGet, objectMap, SetValue, ValueOrGet } from "wy-helper";
import { animate, AnimationOptions, CSSStyleDeclarationWithTransform, ValueKeyframe } from "motion";
import { PageDirection } from "./hookPage";

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