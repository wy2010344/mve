# Event Handling

Canvas nodes support full mouse and pointer event handling.

## Supported Events

Only nodes with `withPath: true` support events:

```typescript
hookDraw({
  withPath: true,
  onClick(e) { },
  onMouseDown(e) { },
  onMouseUp(e) { },
  onPointerDown(e) { },
  onPointerUp(e) { },
  onClickCapture(e) { },
  onPointerDownCapture(e) { },
})
```

## Event Object

```typescript
interface CanvasMouseEvent<T> {
  x: number        // position relative to the node
  y: number        // position relative to the node
  inPath: boolean  // whether inside the path
  inStroke: boolean // whether on the stroke
  original: T      // original DOM event
  node: CNode      // the node that triggered the event
}
```

## Basic Interaction

**Click**:

```typescript
hookDrawRect({
  width: 100,
  height: 50,
  draw({ path }) {
    hookAddRect()
    hookFill('#3498db')
  },
  onClick(e) {
    console.log(`click at (${e.x}, ${e.y})`)
    console.log(`in path: ${e.inPath}`)
  }
})
```

**Hover**:

```typescript
const isHovered = createSignal(false)

hookDrawRect({
  width: 120,
  height: 40,
  draw() {
    hookAddRect()
    hookFill(isHovered.get() ? '#2980b9' : '#3498db')
  },
  onPointerEnter() {
    isHovered.set(true)
  },
  onPointerLeave() {
    isHovered.set(false)
  }
})
```

## Drag

```typescript
const position = createSignal({ x: 100, y: 100 })
const isDragging = createSignal(false)

hookDrawRect({
  x: () => position.get().x,
  y: () => position.get().y,
  width: 80,
  height: 80,
  draw() {
    hookAddRect()
    hookFill(isDragging.get() ? '#e74c3c' : '#3498db')
  },
  onPointerDown(e) {
    isDragging.set(true)
    const startPos = position.get()
    const startX = e.original.clientX - startPos.x
    const startY = e.original.clientY - startPos.y

    const handleMove = (globalE: PointerEvent) => {
      position.set({ x: globalE.clientX - startX, y: globalE.clientY - startY })
    }
    const handleUp = () => {
      isDragging.set(false)
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }
})
```

## Event Bubbling

Canvas events bubble from child to parent:

```typescript
hookDrawRect({
  width: 200,
  height: 200,
  onClickCapture(e) {
    console.log('parent capture phase')
  },
  onClick(e) {
    console.log('parent bubble phase')
  },
  children() {
    hookDrawRect({
      width: 100,
      height: 100,
      x: 50,
      y: 50,
      onClick(e) {
        console.log('child click')
        // event bubbles to parent
      }
    })
  }
})
```

## Event Delegation

For large numbers of interactive elements:

```typescript
hookDrawRect({
  width: 400,
  height: 400,
  onClick(e) {
    const itemIndex = Math.floor(e.y / 50)
    console.log(`clicked item ${itemIndex}`)
  },
  children() {
    for (let i = 0; i < 100; i++) {
      hookDrawRect({
        y: i * 50,
        height: 50,
        alignSelf: alignSelf('stretch')
      })
    }
  }
})
```
