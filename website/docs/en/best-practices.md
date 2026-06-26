# Best Practices & Common Mistakes

## Signal Principles

**Store raw inputs only, derive everything else via computation.**

### Atomic Updates

```typescript
// Correct: replace whole object
const user = createSignal({ name: 'Alice', age: 25 })
user.set({ ...user.get(), age: 26 })

// Wrong: direct property mutation
user.get().age = 26 // won't trigger update

// Optimization: nested signals for granular updates
const userState = createSignal({
  name: createSignal('Alice'),
  age: createSignal(25),
})
userState.get().age.set(26)
```

## DOM Usage

### children() Pitfall

```typescript
// Wrong: signal called at wrong scope
fdom.li({
  children() {
    const todo = getItem() // only initial value
    fdom.span({ children: todo.text }) // won't update
  },
})

// Correct: expand signal inside final child
fdom.li({
  children() {
    fdom.span({
      childrenType: 'text',
      children() {
        const todo = getItem() // always latest
        return todo.text
      },
    })
  },
})
```

## Context

Pass getter functions, not static values:

```typescript
// Correct
ThemeContext.provide(() => theme.get())

// Wrong
ThemeContext.provide(theme.get()) // static, won't update
```

## Reactive System

- Simple calculations: use plain functions `() => count.get() * 2`
- Heavy calculations: use `memo(() => heavyCalc(data.get()))`
- Side effects: use `hookTrackSignal` + `addEffect`
- Don't update signals inside `memo` or `trackSignal` callbacks

## Common Fatal Mistakes

### 1. Calling Signal at component top level

```typescript
// Fatal: render runs once, never updates
export default function () {
  const colors = themeColors() // ❌ static value
  fdom.div({ className: colors.bg }) // never updates
}

// Correct: call inside attribute function
export default function () {
  fdom.div({
    className() {
      return themeColors().bg // ✅ dynamic
    },
  })
}
```

### 2. Wrong effect handling

```typescript
// Wrong: addEffect doesn't track dependencies
addEffect(() => {
  const currentCount = count.get() // won't re-run on change
})

// Correct: use hookTrackSignal
hookTrackSignal(count.get, (currentCount) => {
  addEffect(() => updateLog(currentCount))
})
```
