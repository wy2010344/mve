# 🔄 常用异步信号

## hookPromiseSignal - 异步数据处理

当依赖变化时自动重新请求：

```typescript
function DataComponent() {
  const paramA = createSignal('param1')
  const paramB = createSignal('param2')

  // 当 paramA 或 paramB 变化时，自动重新请求
  const { get, loading, reduceSet } = hookPromiseSignal(() => {
    const a = paramA.get()
    const b = paramB.get()
    return () => fetchRemote(a, b)
  })

  fdom.div({
    children() {
      // 显示加载状态
      renderIf(
        () => loading.get(),
        () => fdom.div({ children: '加载中...' })
      )

      // 处理异步结果
      renderOneKey(get, 'type', (key, getValue) => {
        if (key === 'success') {
          const data = getValue().value
          fdom.div({ children: `数据: ${JSON.stringify(data)}` })
        } else if (key === 'error') {
          fdom.div({ children: '加载失败' })
        }
      })
    },
  })
}
```
