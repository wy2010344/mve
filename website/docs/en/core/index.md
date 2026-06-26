# Reactive System

The reactive core comes from `wy-helper`, providing Signal, memo, and dependency tracking primitives.

## createSignal

Atomic signal, similar to Vue's `shallowRef` or Solid's `createSignal`:

```ts
const count = createSignal(0)
count.get()  // read
count.set(1) // write

// Objects must be replaced as a whole (atomic)
const user = createSignal({ name: 'Alice', age: 25 })
user.set({ ...user.get(), age: 26 })

// For granular updates, use nested signals
const nested = createSignal({
  name: createSignal('Alice'),
  age: createSignal(25),
})
nested.get().age.set(26)
```

## memo

Cached computed value, similar to Vue's `computed`:

```typescript
const a = createSignal(1)
const memoA = memo((old, inited) => {
  return a.get() > 0 ? 'positive' : 'negative'
})

// Smart optimization: same return value skips downstream updates
a.set(5)  // memoA runs but returns 'positive' again, memoB skipped
a.set(-1) // memoA returns 'negative', memoB runs
```

## hookTrackSignal

Reactive effect with auto-cleanup, similar to Vue's `watchEffect`:

```typescript
hookTrackSignal(
  () => signal1.get() + signal2.get(),
  (newValue, oldValue, inited) => {
    console.log('sum changed:', newValue)
    return () => console.log('cleanup on next run')
  }
) // auto-disposed when component unmounts
```

## addEffect

Post-batch callback, similar to `nextTick`:

```typescript
addEffect(() => {
  console.log('all Signal updates completed')
})

// level: -2,-1 (framework internal) < 0 (default) < 1,2... (user level)
addEffect(() => {
  console.log('level 1 - runs after DOM update')
}, 1)
```
