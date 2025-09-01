# 🏗️ Context 系统

类似于 react 的 context.

基于调用栈的上下文传递.

```typescript
const ThemeContext = createContext<() => 'light' | 'dark'>(() => 'light')

function App() {
  const theme = createSignal<'light' | 'dark'>('light')

  fdom.div({
    children() {
      // 提供 getter 函数
      ThemeContext.provide(() => theme.get())
      Header() // 在此调用栈中可获取到主题
    },
  })
}

function Header() {
  const getTheme = ThemeContext.consume() // 获取 getter 函数

  fdom.header({
    s_backgroundColor() {
      return getTheme() === 'dark' ? '#333' : '#f8f9fa' // 调用获取值
    },
  })
}
```

显然,由于只构造一次,并不是像 react 的 context 一样动态变化参数.如何动态变化的参数,一般需要传递 signal,即一个 get 函数.
