import { dom } from "mve-dom"
import { createSignal, GetValue, SetValue } from "wy-helper"

export default function () {

  const a = observer({
    a: 8
  })


  const b = observerArray([] as number[])
  dom.button({
    onClick() {
      console.log("b", b[1])
      b[1] = 9
      b.push(9)
      console.log("aa", a instanceof Oberver)
      a.a = a.a + 1
    }
  }).renderText`abc${() => a.a}`
}



function observer<T extends {}>(o: T) {
  return new Proxy(o, {
    get(target: any, p) {
      if (p == typeSymbol) {
        return true
      }
      const t = target[p]
      if (t instanceof Signal) {
        return t.get()
      } else {
        return setSignal(target, p, t).get()
      }
    },
    set(target: any, p, newValue) {
      const t = target[p]
      newValue = makeObserver(newValue)
      if (t instanceof Signal) {
        t.set(newValue)
      } else {
        setSignal(target, p, newValue)
      }
      return true
    },
  }) as Oberver & T
}

/**
 * 或者实现一个自定义的Array
 */
const setKeys = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
function observerArray<T extends readonly any[]>(o: T) {
  return new Proxy(o, {
    get(target, p, receiver) {
      if (p == typeSymbol) {
        return true
      }

      console.log("svsv", target, p)

    },
    set(target, p, newValue, receiver) {
      console.log("svv", target, p)

      return true
    }
  })
}

export class Oberver {
  private constructor() { }
  [Symbol.hasInstance](instance: any) {
    return isObserver(instance)
  }
}
const typeSymbol = Symbol("type")
function isObserver(o: {}) {
  return (o as any)[typeSymbol]
}
Object.defineProperty(Oberver, Symbol.hasInstance, {
  configurable: false,
  enumerable: false,
  value: isObserver
});

function makeObserver(newValue: any) {
  if (newValue
    && typeof newValue == 'object'
    && !newValue[typeSymbol]) {
    return observer(newValue)
  }
  return newValue
}


const getSymbol = Symbol()


// function get<T extends {}>(o:T,key:keyof T){
//   return o[getSymbol]
// }


function setSignal(target: any, p: any, value: any) {
  const { get, set } = createSignal(value)
  const t = new Signal(get, set)
  target[p] = t
  return t
}

class Signal<T> {
  constructor(
    public readonly get: GetValue<T>,
    public readonly set: SetValue<T>
  ) { }
}