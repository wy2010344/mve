import { KVPair, removeWhere } from "wy-helper"
import { KPair } from "wy-helper/kanren"

export class Any<T extends string> {
  private constructor(
    public readonly flag: T
  ) { }
  static any = new Any('any')
  static string = new Any('string')
  static number = new Any('number')
}


/**
 * 泛型类型
 */
export class VarType {
  constructor(
    public readonly belong: AllMayType
  ) { }
}

export class Fun<T> {
  constructor(
    public readonly arg: T,
    public readonly out: T
  ) { }
}


export class Union<T> {
  constructor(
    public readonly list: T[]
  ) { }
}


export type AllMayType = VarType
  | KVPair<AllMayType>
  | Union<AllMayType>
  | Fun<AllMayType>
  | KPair<AllMayType, AllMayType>
  | string
  | number
  | Any<"any">
  | Any<"string">
  | Any<"number">
  | undefined


export const topScope = new KVPair<AllMayType>(
  'String', Any.string,
  new KVPair<AllMayType>(
    'Number', Any.number,
    new KVPair<AllMayType>(
      'Any', Any.any,
      new KVPair<AllMayType>(
        'Null', undefined
      )
    )
  )
)



/**
 * 之前类似合一,存在变量的绑定
 * 这里已经过了合一阶段,即结构相似所以包含,位置推断
 * 以及一边执行一边替换,得到相同的结构
 * @param a 
 * @param b 
 * @returns 
 */

export function include(a: AllMayType, b: AllMayType): boolean {
  if (a == b) {
    //相同返回,包括Any<"*">,undefined,字面值类型
    return true
  }
  if (b instanceof Union) {
    return b.list.every(rb => include(a, rb))
  }
  if (a instanceof Union) {
    return a.list.some(v => include(v, b))
  }
  if (a instanceof VarType) {
    if (b instanceof VarType) {
      return include(a, b.belong)
    }
    return false
  }
  if (a instanceof Any) {
    if (a.flag == 'any') {
      return true
    }
    if (a.flag == 'string') {
      return typeof b == 'string'
    }
    if (a.flag == 'number') {
      return typeof b == 'number'
    }
    return false
  }
  if (a instanceof Fun) {
    if (b instanceof Fun) {
      return include(a.arg, b.arg) && include(b.out, a.out)
    }
    return false
  }

  if (a instanceof KPair) {
    if (b instanceof KPair) {
      return include(a.left, b.left) && include(a.right, b.right)
    }
    return false
  }
  if (a instanceof KVPair) {
    if (b instanceof KVPair) {
      //b作为子集,key可能更多.
      let x: KVPair<AllMayType> | undefined = a
      while (x) {
        const target = b.get(x.key)
        if (!target) {
          return false
        }
        if (!include(x.value, target.value)) {
          return false
        }
        x = x.rest
      }
      return true
    }
    return false
  }

  return false
}
function unionToList(a: AllMayType, slice?: boolean) {
  return a instanceof Union ? slice ? a.list.slice() : a.list : [a]
}
export function toUnion(a: AllMayType, b: AllMayType): AllMayType {
  const axs = unionToList(a, true)
  const bxs = unionToList(b)
  bxs.forEach(bx => {
    if (!axs.find(v => include(v, bx))) {
      removeWhere(axs, v => include(bx, v))
      axs.push(bx)
    }
  })
  if (axs.length > 1) {
    return new Union(axs)
  }
  return axs[0]
}
