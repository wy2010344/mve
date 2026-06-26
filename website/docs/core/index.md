# 响应式系统

MVE 的响应式核心来自基础库 `wy-helper`，提供了 Signal、memo、依赖追踪等基础设施。

## createSignal 原子信号

Signal 是 MVE 的响应式基础，类似 Vue 的 shallowRef,或 Solid 的 createSignal：

```ts
// 基础用法
const count = createSignal(0)
const { get, set } = createSignal(0) // 可解包

// 对象更新需整体替换（原子性）
const user = createSignal({ name: '张三', age: 25 })
user.set({ ...user.get(), age: 26 }) // ✅ 正确

// 手动创建嵌套信号优化性能
const nested = createSignal({
  name: createSignal('张三'),
  age: createSignal(25),
})
nested.get().age.set(26) // 可单独更新
```

## memo - 智能计算

memo 用于缓存计算结果，具有智能优化特性,类似 vue 的 computed：

```typescript
const a = createSignal(1)

// 回调参数：(old, inited)
// 如果inited是false,即第一次运行,old是undefined
// 如果inited为true,即非第一次运行,old是上一次的值
const memoA = memo((old, inited) => {
  return a.get() > 0 ? 'positive' : 'negative'
})

const memoB = memo(() => `Result: ${memoA()}`)

// 智能优化：相同返回值不触发依赖更新
a.set(5) // memoA 执行，但返回值仍是 'positive'，memoB 不执行
a.set(-1) // memoA 返回值变为 'negative'，memoB 也执行

// 性能考虑：简单计算可直接使用函数
const simpleDouble = () => count.get() * 2 // 无需 memo
```

## hookTrackSignal - 依赖追踪

类似 Vue 的 watchEffect，自动追踪依赖变化：

```typescript
import { hookTrackSignal } from 'mve-helper'
// 组件内使用（推荐）
function MyComponent() {
  hookTrackSignal(
    //oldValue与inited,类似memo的回调参数
    (oldValue, inited) => signal1.get() + signal2.get(),
    (newValue, oldValue, inited) => {
      //只在第一次,与newValue!=oldValue时执行
      //newValue新值,oldValue与inited,类似memo的回调参数
      console.log('和 变化:', newValue)
      //返回值类似于useEffect的销毁回调,是可选的
      return function () {
        console.log('next time clear')
      }
    }
  ) // 组件销毁时自动清理
}

import { runGlobalHolder } from 'mve-core'
// 全局使用
runGlobalHolder(() => {
  hookTrackSignal(signal.get, (newValue, oldValue, inited) => {
    document.title = `Signal: ${newValue}`
  })
})
```

## addEffect - 批量更新后回调

类似 nextTick，在 Signal 更新完成后执行：

```typescript
// 基础用法
addEffect(() => {
  console.log('所有 Signal 更新完成')
})

// level 层级：-1,-2(框架内部) < 0(默认) < 1,2...(用户级别)
addEffect(() => {
  console.log('级别 1 - 在 DOM 更新后执行')
}, 1)

// 常见模式：在 hookTrackSignal 回调中按需使用
hookTrackSignal(
  () => signal1.get() + signal2.get(),
  (newValue) => {
    addEffect(() => {
      // 可以在这里更新其他 Signal,同步执行,本身就相当于useLayoutEffect.
      signalA.set(div.offsetHeight)
    })
  }
)
```
