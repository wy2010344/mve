import { PointKey, ValueOrGet, valueOrGetToGet } from "wy-helper"
import { Mdisplay, SizeKey } from "."


type DisplayProps = {
  direction?: ValueOrGet<PointKey>
  alignItems?: ValueOrGet<'center' | 'start' | 'end'>
  gap?: ValueOrGet<number>
}
export function flexDisplay(
  {
    direction = 'y',
    alignItems = 'center',
    gap = 0
  }: DisplayProps
): Mdisplay {
  const getDirection = valueOrGetToGet(direction)
  const getAlignItems = valueOrGetToGet(alignItems)
  const getGap = valueOrGetToGet(gap)
  return function (n) {
    let length = 0
    let width = 0
    const list: number[] = [0]
    const d = getDirection()
    const s = directionToSize(d)
    const od = oppositeDirection(d)
    const os = directionToSize(od)


    const gap = getGap()
    const ai = getAlignItems()
    n.children().forEach(child => {
      length = length + child[s]() + gap
      list.push(
        length
      )
      width = Math.max(child[os](), width)
    })
    if (length) {
      length = length - gap
    }
    //render两次,是伸缩长度在捣鬼,任何一处auto都有可能
    // console.log("执行一次", list, d, n.children().length, n.index())
    return {
      getChildInfo(x, i) {
        // console.log("get", x, i)
        if (x == d) {
          const row = list[i]
          return row
        }
        if (x == od) {
          if (ai == 'start') {
            return 0
          } else if (ai == 'center') {
            const child = n.children()[i]
            return (width - child[os]()) / 2
          } else if (ai == 'end') {
            const child = n.children()[i]
            return width - child[os]()
          }
        }
        throw ''
      },
      getInfo(x) {
        // console.log("gext", x)
        if (x == s) {
          return length
        } else if (x == os) {
          return width
        }
        throw ''
      }
    }
  }
}
function directionToSize(x: PointKey): SizeKey {
  if (x == 'x') {
    return "width"
  } else {
    return "height"
  }
}
function oppositeDirection(x: PointKey): PointKey {
  if (x == 'x') {
    return 'y'
  } else {
    return 'x'
  }
}