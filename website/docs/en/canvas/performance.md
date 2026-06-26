# Performance

Optimization strategies for the Canvas rendering system.

## skipDraw

`skipDraw` is the most important optimization tool:

```typescript
hookDrawRect({
  skipDraw(rect) {
    const top = rect.axis.y.position()
    const bottom = top + rect.axis.y.size()
    return bottom < 0 || top > containerHeight
  },
  draw() {
    // only runs when skipDraw returns false
  }
})
```

## Virtual Scrolling

For large data lists:

```typescript
import { OnScroll } from 'mve-dom-helper'

const data = Array.from({ length: 10000 }, (_, i) => `item ${i}`)
const itemHeight = 50
const containerHeight = 600

const scrollY = new OnScroll('y', {
  maxScroll() { return data.length * itemHeight - containerHeight }
})

hookDrawRect({
  width: 400, height: containerHeight,
  paddingTop: () => -scrollY.get(),
  onPointerDown(e) { scrollY.pointerEventListner(e.original) },
  children() {
    const scroll = scrollY.get()
    const startIndex = Math.floor(scroll / itemHeight)
    const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, data.length)
    for (let i = startIndex; i < endIndex; i++) {
      hookDrawRect({
        y: i * itemHeight, height: itemHeight, alignSelf: alignSelf('stretch'),
        skipDraw(rect) {
          return (rect.axis.y.position() + rect.axis.y.size()) < 0 || rect.axis.y.position() > container.axis.y.size()
        },
        children() { hookDrawText({ config: { text: data[i] }, alignSelf: alignSelf('center') }) }
      })
    }
  }
})
```

## Memo Caching

```typescript
// avoid recomputation on every frame
const cachedWidth = memo(() => someComplexCalculation())

hookDrawRect({ width: () => cachedWidth() })
```

## Batch Updates

```typescript
import { batch } from 'wy-helper'

// triggers only one redraw
batch(() => {
  items.forEach(item => {
    item.position.set(newPosition)
    item.color.set(newColor)
  })
})
```

## Draw Optimization

**Cache expensive objects**:

```typescript
const cachedGradient = memo(() => {
  const ctx = getOneCtx()
  return ctx.createRadialGradient(...)
})

hookDrawRect({ draw() { hookFill(cachedGradient()) } })
```

**Reuse path objects**:

```typescript
const circlePath = new Path2D()
circlePath.arc(50, 50, 30, 0, Math.PI * 2)

hookDraw({ withPath: true, draw({ ctx }) { ctx.fill(circlePath) } })
```

## Memory Management

```typescript
import { hookAddDestroy } from 'mve-core'

hookAddDestroy(() => {
  // cleanup logic
})
```

## FPS Monitoring

```typescript
const fps = createSignal(0)
let lastTime = performance.now()
let frameCount = 0

function updateFPS() {
  frameCount++
  const currentTime = performance.now()
  if (currentTime - lastTime >= 1000) {
    fps.set(Math.round((frameCount * 1000) / (currentTime - lastTime)))
    frameCount = 0
    lastTime = currentTime
  }
  requestAnimationFrame(updateFPS)
}
updateFPS()

hookDrawText({
  config: () => ({ text: `FPS: ${fps.get()}`, fillStyle: fps.get() < 30 ? '#e74c3c' : '#27ae60' })
})
```

## Best Practices

1. Use `skipDraw` for off-screen elements
2. Virtual scroll lists exceeding 100 items
3. Cache complex computations with `memo`
4. Batch state updates with `batch`
5. Avoid expensive draw operations per frame
6. Clean up resources via `hookAddDestroy`
7. Monitor FPS during development
8. Use `renderArrayKey` for dynamic lists
9. Convert mutable data to signals for reactive rendering
