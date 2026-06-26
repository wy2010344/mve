# Best Practices

Key principles and common pitfalls.

## Core Principles

### Keep It Simple

- Avoid unnecessary abstractions and wrapper functions
- Use existing API directly, do not add intermediate layers
- Prefer simple, direct solutions

### Layout System Understanding

- Only containers with `layout()` set provide `axis.x.size()` to children
- In layout containers, child positions are computed by the layout system; do not set x, y manually
- Use `alignSelf` to control child alignment within the layout

## Common Pitfalls

### Draw Mode Confusion

```typescript
// Wrong: using ctx directly in withPath mode
hookDraw({
  withPath: true,
  draw({ ctx }) {
    ctx.fillRect(0, 0, 100, 100) // no event detection
  }
})

// Correct: use path in withPath mode
hookDraw({
  withPath: true,
  draw({ path }) {
    path.rect(0, 0, 100, 100)
    hookFill('#3498db')
  }
})
```

### Layout Access Errors

```typescript
// Wrong: accessing size() without layout()
hookDrawRect({
  width: 100,
  height: 50,
  draw({ rect }) {
    const width = rect.axis.x.size() // may error
  }
})

// Correct: provide layout() or use fixed values
hookDrawRect({
  width: 100,
  height: 50,
  layout() {
    return simpleFlex({ direction: 'x' })
  },
  draw({ rect }) {
    const width = rect.axis.x.size()
  }
})
```

### Event Handling

```typescript
// Wrong: missing withPath
hookDrawRect({
  draw() {
    hookAddRect()
    hookFill('#3498db')
  },
  onClick() {
    // will not fire: no withPath: true
  }
})

// Correct: set withPath
hookDrawRect({
  draw() {
    hookAddRect()
    hookFill('#3498db')
  },
  onClick() {
    // fires correctly
  }
})
```

## Performance Tips

### skipDraw

```typescript
hookDrawRect({
  skipDraw(rect) {
    const top = rect.axis.y.position()
    const bottom = top + rect.axis.y.size()
    return bottom < 0 || top > containerHeight
  }
})
```

### Memo

```typescript
const expensiveValue = memo(() => {
  return someComplexCalculation()
})

hookDrawRect({
  width: () => expensiveValue()
})
```

### Batch

```typescript
import { batch } from 'wy-helper'

batch(() => {
  position.set(newPos)
  color.set(newColor)
  size.set(newSize)
})
```
