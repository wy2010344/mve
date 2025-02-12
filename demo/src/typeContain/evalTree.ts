import { KVPair } from "wy-helper";
import { EndNode, InfixEndNode, NNode, InfixNode } from "./parse";
import { AllMayType } from "./define";


export function evalTree(n: EndNode, scope?: KVPair<AllMayType>): AllMayType {
  if (n.type == 'infix') {
    const infixValue = n.infix.value
    if (infixValue == 'in') {
      scope = evalBind(n.left, scope)
      return evalTree(n.right, scope)
    } else if (infixValue == 'where') {
      scope = evalBind(n.right, scope)
      return evalTree(n.left, scope)
    } else {
      return evalBuild(n, scope)
    }
  } else if (n.type == 'number' || n.type == 'string') {
    return n.originalValue
  } else {
    const ta = scope?.get(n.value)
    if (ta) {
      return ta.value
    } else {
      n.messages.push({
        type: "error",
        value: "未找到任何定义"
      })
    }
  }
}

function evalKV(
  left: InfixNode<NNode>,
  scope?: KVPair<AllMayType>,
  parent?: KVPair<AllMayType>
) {
  const leftValue = left.left
  if (leftValue.type == 'string' || leftValue.type == 'symbol') {
    return new KVPair(
      leftValue.value,
      evalTree(left.right, scope),
      parent
    )
  } else {
    leftValue.messages.push({
      type: "error",
      value: "目前不支持这种结构"
    })
  }
}
function evalKVs(left: InfixEndNode<NNode>, scope?: KVPair<AllMayType>): KVPair<AllMayType> | undefined {
  if (left.type == 'infix') {
    if (left.infix.value == ',') {
      const leftValue = evalKVs(left.left, scope)
      const right = left.right
      if (right.type == 'infix' && right.infix.value == ':') {
        return evalKV(
          right,
          scope,
          leftValue
        )
      } else {
        right.messages.push({
          type: "error",
          value: "目前不支持这种结构"
        })
      }
    } else if (left.infix.value == ':') {
      return evalKV(left, scope)
    } else {
      left.messages.push({
        type: "error",
        value: '不是合法的表达式'
      })
    }
  }
}
export function evalBuild(n: InfixNode<NNode>, scope?: KVPair<AllMayType>) {
  if (n.infix.value == ',') {
    return evalKVs(n, scope)
  }
}

function evalBindSingle(n: InfixNode<NNode>, scope?: KVPair<AllMayType>): KVPair<AllMayType> | undefined {
  const infixValue = n.infix.value
  const left = n.left
  if (left.type == 'symbol') {
    if (infixValue == '=') {
      return new KVPair(
        left.value,
        evalTree(n.right, scope),
        scope
      )
    } else {
      n.messages.push({
        type: "error",
        value: "不支持的绑定类型"
      })
    }
  } else {
    left.messages.push({
      type: "error",
      value: "目前只支持symbol"
    })
  }
  return scope
}

function evalBind(n: InfixEndNode<NNode>, scope?: KVPair<AllMayType>) {
  if (n.type == 'infix') {
    if (n.infix.value == ',') {
      scope = evalBind(n.left, scope)
      const right = n.right
      if (right.type == 'infix') {
        scope = evalBindSingle(right, scope)
      } else {
        right.messages.push({
          type: "error",
          value: '需要是key-value类型'
        })
      }
    } else {
      scope = evalBindSingle(n, scope)
    }
  } else {
    n.messages.push({
      type: "error",
      value: "声明部分只能为key-value"
    })
  }
  return scope
}