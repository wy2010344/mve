# MVE 框架架构概述

基于你的深入解释，MVE 框架的架构可以分为以下几个核心层次：

## 🏗️ 架构层次

### 1. 核心响应式系统 (wy-helper/signal.ts)

这是 MVE 的心脏，提供了响应式的基础设施：

#### Signal - 响应式状态容器

```typescript
import { createSignal } from 'wy-helper'

// Signal 是响应式状态的基础单元
const count = createSignal(0)

// Signal 内部维护：
// - 当前值
// - 观察者列表 (observers)
// - 变更通知机制
```

#### trackSignal - 依赖追踪观察

```typescript
import { trackSignal, hookTrackSignal } from 'wy-helper'

// trackSignal 类似 Vue 的 watchEffect
trackSignal(
  (oldValue, initd) => count.get(),
  (newValue, oldValue, inited) => {
    console.log(`count 变为 ${newValue}`)
  }
) //返回一个销毁函数

// 推荐使用 hookTrackSignal（自动绑定到 stateHolder）
function MyComponent() {
  //在mve框架下,使用hookTrackSignal,不需要处理销毁.
  hookTrackSignal(
    () => count.get(),
    (newValue) => {
      console.log(`count 变为 ${newValue}`)
    }
  )
}

// 全局使用
runGlobalHolder(() => {
  hookTrackSignal(
    () => count.get(),
    (newValue) => {
      document.title = `Count: ${newValue}`
    }
  )
})
```

#### memo - 计算优化

```typescript
import { memo } from 'wy-helper'

// memo 类似 Vue 的 computed，具有智能优化
// 回调参数：(old, inited) => old: 旧值，inited: 是否不是第一次执行
const memoA = memo((old, inited) => {
  console.log('memoA 计算', { old, inited })
  return count.get() > 0 ? 'positive' : 'negative'
})

const memoB = memo((old, inited) => {
  console.log('memoB 计算', { old, inited })
  return `Result: ${memoA()}`
})

// 智能优化：即使 count 变化，如果 memoA 返回值相同，memoB 不会重新计算
```

#### addEffect - 批量更新后的回调

```typescript
import { addEffect } from 'wy-helper'

// addEffect 类似于 nextTick，支持 level 层级
// level -1, -2: DOM 更新的副作用（框架内部）
// level 0: 默认级别
// level > 0: 用户级别，一般需要大于 -1

addEffect(() => {
  console.log('默认级别 0')
}) // 默认 level 0

addEffect(() => {
  console.log('级别 1 - 在 DOM 更新后')
}, 1)

// 常见模式：在 hookTrackSignal 回调中按需使用
hookTrackSignal(
  () => signal.get(),
  (newValue) => {
    // 执行一些操作
    addEffect(() => {
      // 在所有更新完成后执行
      console.log('DOM 已更新')
    })
  }
)