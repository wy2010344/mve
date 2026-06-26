# Interactive Patterns

Common interaction patterns and their implementations.

## Drag

### Basic Drag

```typescript
import { pointerMove } from 'wy-dom-helper'

function renderDraggableElement() {
  const position = createSignal({ x: 100, y: 100 })

  return hookDrawText({
    x: () => position.get().x,
    y: () => position.get().y,
    config: { text: 'drag me' },
    onPointerDown(e) {
      const startPos = position.get()
      pointerMove({
        onMove(moveE) {
          position.set({
            x: startPos.x + (moveE.pageX - e.original.pageX),
            y: startPos.y + (moveE.pageY - e.original.pageY),
          })
        },
      })
    },
  })
}
```

### Constrained Drag

```typescript
function renderConstrainedDrag() {
  const position = createSignal({ x: 100, y: 100 })
  const bounds = { minX: 0, minY: 0, maxX: 400, maxY: 300 }

  return hookDrawText({
    x: () => position.get().x,
    y: () => position.get().y,
    config: { text: 'constrained' },
    onPointerDown(e) {
      const startPos = position.get()
      pointerMove({
        onMove(moveE) {
          const deltaX = moveE.pageX - e.original.pageX
          const deltaY = moveE.pageY - e.original.pageY
          position.set({
            x: Math.max(bounds.minX, Math.min(bounds.maxX, startPos.x + deltaX)),
            y: Math.max(bounds.minY, Math.min(bounds.maxY, startPos.y + deltaY)),
          })
        },
      })
    },
  })
}
```

### Grid Snap

```typescript
function renderGridSnap() {
  const position = createSignal({ x: 100, y: 100 })
  const gridSize = 20

  function snapToGrid(value: number) {
    return Math.round(value / gridSize) * gridSize
  }

  return hookDrawText({
    x: () => position.get().x,
    y: () => position.get().y,
    config: { text: 'grid snap' },
    onPointerDown(e) {
      const startPos = position.get()
      pointerMove({
        onMove(moveE) {
          position.set({
            x: snapToGrid(startPos.x + (moveE.pageX - e.original.pageX)),
            y: snapToGrid(startPos.y + (moveE.pageY - e.original.pageY)),
          })
        },
      })
    },
  })
}
```

## Selection

### Single Select

```typescript
const selectedId = createSignal<number | null>(null)

hookDrawText({
  config: () => ({ text: getItem().label }),
  draw({ path, draw }) {
    if (isSelected()) {
      hookAddRect(4); hookFill('#e3f2fd'); hookStroke(2, '#2196f3')
    } else {
      hookAddRect(4); hookFill('#f5f5f5'); hookStroke(1, '#ccc')
    }
    draw({ style: isSelected() ? '#1976d2' : '#333' })
  },
  onClick() { selectedId.set(itemId) }
})
```

### Multi Select

```typescript
onClick(e) {
  const selected = new Set(selectedIds.get())
  if (e.original.ctrlKey || e.original.metaKey) {
    if (selected.has(itemId)) selected.delete(itemId)
    else selected.add(itemId)
  } else {
    selected.clear()
    selected.add(itemId)
  }
  selectedIds.set(selected)
}
```

### Box Select

```typescript
function renderBoxSelect() {
  const selectedIds = createSignal(new Set<number>())
  const selectionBox = createSignal<{ startX: number, startY: number, endX: number, endY: number, active: boolean } | null>(null)

  return hookDrawRect({
    width: 800, height: 600,
    onPointerDown(e) {
      selectionBox.set({ startX: e.x, startY: e.y, endX: e.x, endY: e.y, active: true })
      pointerMove({
        onMove(moveE) {
          const box = selectionBox.get()
          if (box) selectionBox.set({ ...box, endX: moveE.offsetX, endY: moveE.offsetY })
        },
        onEnd() {
          const box = selectionBox.get()
          if (box) {
            const selected = new Set<number>()
            const minX = Math.min(box.startX, box.endX)
            const maxX = Math.max(box.startX, box.endX)
            const minY = Math.min(box.startY, box.endY)
            const maxY = Math.max(box.startY, box.endY)
            items.get().forEach(item => {
              if (item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY) {
                selected.add(item.id)
              }
            })
            selectedIds.set(selected)
          }
          selectionBox.set(null)
        }
      })
    },
    children() {
      renderArrayKey(items.get, item => item.id, ...)
      renderIf(() => selectionBox.get()?.active === true, function () {
        const box = selectionBox.get()!
        return hookDrawRect({
          x: Math.min(box.startX, box.endX), y: Math.min(box.startY, box.endY),
          width: Math.abs(box.endX - box.startX), height: Math.abs(box.endY - box.startY),
          draw() { hookAddRect(); hookFill('rgba(33, 150, 243, 0.1)'); hookStroke(1, '#2196f3') }
        })
      })
    }
  })
}
```

## Connection Mode

```typescript
const connections = createSignal<Connection[]>([])
const dragConnection = createSignal<{ fromId: number, startX: number, startY: number, currentX: number, currentY: number } | null>(null)

hookDrawText({
  onPointerDown(e) {
    dragConnection.set({
      fromId: nodeId, startX: e.x + getNode().x, startY: e.y + getNode().y,
      currentX: e.x + getNode().x, currentY: e.y + getNode().y
    })
    e.original.stopPropagation()
  },
  onPointerUp(e) {
    const drag = dragConnection.get()
    if (drag && drag.fromId !== nodeId) {
      connections.set([...connections.get(), { id: `conn_${Date.now()}`, fromId: drag.fromId, toId: nodeId, label: 'link' }])
    }
    dragConnection.set(null)
  }
})
```

## Zoom and Pan

```typescript
const viewport = createSignal({ x: 0, y: 0, scale: 1 })

hookDrawRect({
  width: canvas.width, height: canvas.height,
  onWheel(e) {
    const delta = e.original.deltaY > 0 ? 0.9 : 1.1
    const view = viewport.get()
    viewport.set({ ...view, scale: Math.max(0.1, Math.min(5, view.scale * delta)) })
  },
  onPointerDown(e) {
    if (e.original.button === 1) {
      const startView = viewport.get()
      pointerMove({
        onMove(moveE) {
          viewport.set({
            ...startView,
            x: startView.x + (moveE.pageX - e.original.pageX),
            y: startView.y + (moveE.pageY - e.original.pageY),
          })
        },
      })
    }
  },
  children() {
    hookDraw({
      draw({ ctx }) {
        const view = viewport.get()
        ctx.translate(view.x, view.y)
        ctx.scale(view.scale, view.scale)
      },
      children() { renderContent() }
    })
  }
})
```
