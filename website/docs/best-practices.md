# MVE 最佳实践与常见错误

掌握这些最佳实践，避免常见陷阱，写出高效的 MVE 代码。

## Signal 使用原则

**原则：只存储原始输入，其他都用计算属性推导。** 不要把中间计算结果当作状态存储。

### Signal 原子性

```typescript
// ✅ 正确：整体替换
const user = createSignal({ name: '张三', age: 25 })
user.set({ ...user.get(), age: 26 })

// ❌ 错误：直接修改属性
user.get().age = 26 // 不会触发更新

// ✅ 优化：手动创建嵌套信号
const userState = createSignal({
  name: createSignal('张三'),
  age: createSignal(25),
})
userState.get().age.set(26) // 可单独更新
```

## DOM 使用要点

### children() 正确用法

```typescript
// ❌ 错误：在 children 回调中获取信号
fdom.li({
  children() {
    const todo = getItem() // 只获得初始值
    fdom.span({ children: todo.text }) // 不会更新
  },
})

// ✅ 正确：在最终属性节点展开
fdom.li({
  children() {
    fdom.span({
      childrenType: 'text', //主要是指定了childrenType为text或html,此时children不是组件列表,而是内容
      children() {
        const todo = getItem() // 动态获取最新值
        return todo.text
      },
    })
  },
})
```

### 属性转换规则

```typescript
fdom.div({
  s_backgroundColor: 'red', // style.backgroundColor
  data_testId: 'my-div', // data-testId
  css_primaryColor: '#007bff', // --primaryColor
  aria_label: '主要内容', // aria-label
})
```

## Context 使用

### 基于调用栈的 Context

```typescript
// ✅ 正确：传递 getter 函数
ThemeContext.provide(() => theme.get())
Header() // 在此调用栈中可获取

// ❌ 错误：传递值
ThemeContext.provide(theme.get()) // 静态值，不会更新

// 消费 Context
function Header() {
  const getTheme = ThemeContext.consume() // 获取 getter 函数

  fdom.header({
    s_backgroundColor() {
      return getTheme() === 'dark' ? '#333' : '#f8f9fa' // 调用获取值
    },
  })
}
```

## 响应式系统要点

### memo 使用时机

```typescript
// 简单计算：直接使用函数
const simpleDouble = () => count.get() * 2

// 复杂计算：使用 memo
const complexCalc = memo(() => heavyCalculation(data.get()))
```

### 副作用处理

```typescript
// ✅ 正确：在 addEffect 里处理信号更新,一般需要包装在hookTrackSignal里
hookTrackSignal(
  () => count.get(),
  (newValue) => {
    addEffect(() => {
      // 可以在这里更新其他 Signal
      signalA.set(div.scrollHeight)
    })
  }
)

// ❌ 错误：在 memo 或 trackSignal 回调中直接更新 Signal
const computed = memo(() => {
  const result = calculate(input.get())
  signalA.set(result) // 错误！
  return result
})
```

## 其他要点

### 列表渲染

```typescript
// ✅ 使用稳定的 key
renderArrayKey(
  () => items.get(),
  (item) => item.id, // 稳定的 id
  (getItem, getIndex, key) => {
    /* 渲染逻辑 */
  }
)

// ❌ 使用不稳定的 key
renderArrayKey(
  () => items.get(),
  (item, index) => index // 不稳定
  // ...
)
```

### 状态管理

```typescript
// ✅ 直接使用 Signal
const appState = createSignal({
  user: null,
  theme: 'light'
})

// ❌ 不必要的类封装
class UserStore {
  private _state = createSignal({...})
  // ...
}
```

## 核心原则

1. **Signal 是原子的**：对象更新需整体替换
2. **传递函数不是值**：Context 传递 getter 函数
3. **属性函数中调用**：只有在属性函数中调用 Signal 才能建立响应式绑定
4. **memo 有开销**：简单计算可直接使用函数
5. **addEffect level > -1**：用户级别需要大于 -1

### 常见模式

```typescript
// 状态管理
const state = createSignal(initialValue)
const computed = memo(() => calculate(state.get()))

// 依赖追踪
hookTrackSignal(
  () => state.get(),
  (newValue) => {
    addEffect(() => {
      /* 副作用 */
    }, 1)
  }
)

// 列表渲染
renderArrayKey(
  () => items.get(),
  (item) => item.id,
  (getItem) => {
    // 渲染逻辑
  }
)
```

## 最关键的错误

### 1. 响应式绑定位置错误

**最常见错误**：在组件顶层调用 Signal 函数

```typescript
// ❌ 致命错误：render 函数只执行一次，永远不会更新
export default function () {
  const { themeColors } = gContext.consume()
  const colors = themeColors() // ❌ 只获得初始值

  fdom.div({
    className: `${colors.bg} ${colors.text}`, // ❌ 永远不会更新
  })
}

// ✅ 正确：在属性函数中调用
export default function () {
  const { themeColors } = gContext.consume()

  fdom.div({
    className() {
      const colors = themeColors() // ✅ 动态获取最新值
      return `${colors.bg} ${colors.text}`
    },
  })
}
```

### 2. 副作用处理错误

```typescript
// ❌ 错误：addEffect 不会追踪依赖
addEffect(() => {
  const currentCount = count.get() // 不会在 count 变化时执行
  updateLog(currentCount)
})

// ✅ 正确：使用 hookTrackSignal 建立依赖追踪
hookTrackSignal(count.get, (currentCount) => {
  addEffect(() => {
    updateLog(currentCount)
  })
})
```
