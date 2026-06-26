# Lifecycle Management

MVE components execute their main function only once (unlike React's repeated rendering).

```typescript
function TimerComponent() {
  const time = createSignal(new Date().toLocaleTimeString())
  const timer = setInterval(() => {
    time.set(new Date().toLocaleTimeString())
  }, 1000)

  // Register cleanup
  hookDestroy(() => {
    clearInterval(timer)
  })

  fdom.div({
    children() {
      fdom.p({
        childrenType: 'text',
        children() { return `Time: ${time.get()}` },
      })
    },
  })
}
```

## Batch Update Flow

```
Event triggers Signal update
  │
  ├─ messageChannel (async batching)
  └─ batchSignalEnd (manual immediate)

Batch execution:
  1. Run affected trackSignal listeners (repeat until no new listeners)
  2. Run new listeners:
     a. Trigger memo caches
     b. Initialize/destroy components
     c. Register into signal observer lists
  3. Run effects by level:
     -2: update DOM children
     -1: update DOM attributes
     ≥0: user effects
  4. Check for new signal changes, repeat if needed
```
