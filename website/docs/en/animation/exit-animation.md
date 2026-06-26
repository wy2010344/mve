# View Switch Animation

Use `getExitAnimateArray` for list item enter/exit animations.

## Basic Usage

```typescript
const getAnimatedList = getExitAnimateArray(list.get, {
  getKey: (item) => item.id,
  mode: () => 'pop',     // 'pop' (end) or 'shift' (start)
  wait: () => 'normal',  // 'normal', 'in-out', 'out-in'
})

fdom.ul({
  children() {
    renderArray(getAnimatedList, (row) => {
      const div = fdom.li({ children: () => row.value().name })
      hookTrackSignal(row.step, (step) => {
        if (!row.promise()) return
        if (step === 'enter') {
          animate(div, { x: ['100%', 0] }).then(row.resolve)
        } else if (step === 'exiting') {
          animate(div, { x: [0, '100%'] }).then(row.resolve)
        }
      })
      return div
    })
  },
})
```

## ExitModel Interface

```typescript
interface ExitModel<V, K> {
  value: GetValue<V>
  key: K
  step: GetValue<string>       // "enter" | "exiting" | "will-exiting"
  resolve: () => void
  promise: GetValue<Promise<void> | undefined>
}
```

## Animation Callbacks

```typescript
const getAnimatedList = getExitAnimateArray(list.get, {
  getKey: (item) => item.id,
  onEnterComplete: () => console.log('enter done'),
  onExitComplete: () => console.log('exit done'),
})
```
