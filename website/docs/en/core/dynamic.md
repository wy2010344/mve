# Rendering System

## renderForEach

Most basic dynamic list rendering:

```ts
renderForEach<number, string>(
  callback => {
    const m = map.get()
    m.forEach((key, value) => callback(key, value))
  },
  (key, et) => {
    fdom.div({ children: `${key}--${et.getIndex()}--${et.getValue()}` })
  }
)
```

## renderArrayKey — List with stable keys

```typescript
renderArrayKey(
  () => items.get(),
  (item) => item.id,           // stable key
  (getItem, getIndex, key) => {
    fdom.li({
      children() {
        fdom.span({
          childrenType: 'text',
          children() { return `${getIndex() + 1}. ${getItem().text}` },
        })
      },
    })
  }
)
```

## Conditional Rendering

```typescript
renderIf(
  () => isLoading.get(),
  () => fdom.div({ children: 'Loading...' }),
  () => fdom.div({ children: 'Done' })
)
```

## Union Type Rendering

```typescript
// Useful for async states
renderOneKey(getAsyncResult, 'type', (key, get) => {
  if (key === 'success') {
    fdom.div({ children: 'Success' })
  } else if (key === 'error') {
    fdom.div({ children: 'Error' })
  }
})
```

## Other Helpers

| Function | Purpose |
|----------|---------|
| `renderArray` | Iterate array, use value as key |
| `renderArrayP` | Accept both static and signal arrays |
| `renderRecord` | Iterate object key-value pairs |
| `renderMap / renderSet` | Iterate Map/Set |
| `renderArrayToMap` | Convert array to responsive Map |
| `memoArray` | Memoize array by content equality |
| `memoEqual` | Custom equality memoization |
