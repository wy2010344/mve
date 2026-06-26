# Async Signals

## hookPromiseSignal

Auto-refetch when dependencies change:

```typescript
function DataComponent() {
  const paramA = createSignal('param1')
  const paramB = createSignal('param2')

  const { get, loading, reduceSet } = hookPromiseSignal(() => {
    const a = paramA.get()
    const b = paramB.get()
    return () => fetchRemote(a, b)
  })

  fdom.div({
    children() {
      renderIf(() => loading.get(), () => fdom.div({ children: 'Loading...' }))
      renderOneKey(get, 'type', (key, getValue) => {
        if (key === 'success') {
          fdom.div({ children: `Data: ${JSON.stringify(getValue().value)}` })
        } else if (key === 'error') {
          fdom.div({ children: 'Failed to load' })
        }
      })
    },
  })
}
```
