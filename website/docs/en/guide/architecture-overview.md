# MVE Framework Architecture Overview

Based on your detailed explanation, the MVE framework architecture can be divided into the following core layers:

## 🏗️ Architecture Layers

### 1. Core Reactive System (wy-helper/signal.ts)

This is the heart of MVE, providing the reactive infrastructure:

#### Signal - Reactive State Container

```typescript
import { createSignal } from 'wy-helper'

// Signal is the basic unit of reactive state
const count = createSignal(0)

// Signal internally maintains:
// - Current value
// - List of observers
// - Change notification mechanism
```

#### trackSignal - Dependency Tracking Observation

```typescript
import { trackSignal, hookTrackSignal } from 'wy-helper'

// trackSignal is similar to Vue's watchEffect
trackSignal(
  (oldValue, initd) => count.get(),
  (newValue, oldValue, inited) => {
    console.log(`count changed to ${newValue}`)
  }
) // returns a destroy function

// Recommended: use hookTrackSignal (automatically bound to stateHolder)
function MyComponent() {
  // In MVE framework, use hookTrackSignal without worrying about cleanup
  hookTrackSignal(
    () => count.get(),
    (newValue) => {
      console.log(`count changed to ${newValue}`)
    }
  )
}

// Global usage
runGlobalHolder(() => {
  hookTrackSignal(
    () => count.get(),
    (newValue) => {
      document.title = `Count: ${newValue}`
    }
  )
})
```

#### memo - Computation Optimization

```typescript
import { memo } from 'wy-helper'

// memo is similar to Vue's computed with smart optimization
// Callback parameters: (old, inited) => old: previous value, inited: whether it's the first execution
const memoA = memo((old, inited) => {
  console.log('memoA calculation', { old, inited })
  return count.get() > 0 ? 'positive' : 'negative'
})

const memoB = memo((old, inited) => {
  console.log('memoB calculation', { old, inited })
  return `Result: ${memoA()}`
})

// Smart optimization: even if count changes, memoB won't recalculate if memoA returns the same value
```

#### addEffect - Callback After Batch Updates

```typescript
import { addEffect } from 'wy-helper'

// addEffect is similar to nextTick, with level support
// level -1, -2: DOM update side effects (internal to the framework)
// level 0: default level
// level > 0: user level, generally needs to be greater than -1

addEffect(() => {
  console.log('Default level 0')
}) // default level 0

addEffect(() => {
  console.log('Level 1 - After DOM updates')
}, 1)

// Common pattern: use on demand in hookTrackSignal callback
hookTrackSignal(
  () => signal.get(),
  (newValue) => {
    // Perform some operations
    addEffect(() => {
      // Execute after all updates are complete
      console.log('DOM updated')
    })
  }
)
```
