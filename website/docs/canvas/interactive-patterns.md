# 交互模式

Canvas 系统常见的交互模式和实现方法。

## 拖拽模式

### 基础拖拽

```typescript
import { pointerMove } from 'wy-dom-helper'

function renderDraggableElement() {
  const position = createSignal({ x: 100, y: 100 })

  return hookDrawText({
    x: () => position.get().x,
    y: () => position.get().y,
    config: { text: '拖拽我' },

    onPointerDown(e) {
      const startPos = position.get()

      pointerMove({
        onMove(moveE) {
          const deltaX = moveE.pageX - e.original.pageX
          const deltaY = moveE.pageY - e.original.pageY
          position.set({
            x: startPos.x + deltaX,
            y: startPos.y + deltaY,
          })
        },
      })
    },
  })
}
```

### 约束拖拽

```typescript
function renderConstrainedDrag() {
  const position = createSignal({ x: 100, y: 100 })
  const bounds = { minX: 0, minY: 0, maxX: 400, maxY: 300 }

  return hookDrawText({
    x: () => position.get().x,
    y: () => position.get().y,
    config: { text: '约束拖拽' },

    onPointerDown(e) {
      const startPos = position.get()

      pointerMove({
        onMove(moveE) {
          const deltaX = moveE.pageX - e.original.pageX
          const deltaY = moveE.pageY - e.original.pageY

          // 应用约束
          const newX = Math.max(
            bounds.minX,
            Math.min(bounds.maxX, startPos.x + deltaX)
          )
          const newY = Math.max(
            bounds.minY,
            Math.min(bounds.maxY, startPos.y + deltaY)
          )

          position.set({ x: newX, y: newY })
        },
      })
    },
  })
}
```

### 网格对齐拖拽

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
    config: { text: '网格对齐' },

    onPointerDown(e) {
      const startPos = position.get()

      pointerMove({
        onMove(moveE) {
          const deltaX = moveE.pageX - e.original.pageX
          const deltaY = moveE.pageY - e.original.pageY

          position.set({
            x: snapToGrid(startPos.x + deltaX),
            y: snapToGrid(startPos.y + deltaY),
          })
        },
      })
    },
  })
}
```

## 选择模式

### 单选

```typescript
function renderSelectableItems() {
  const items = createSignal([
    { id: 1, label: '项目 1', x: 100, y: 100 },
    { id: 2, label: '项目 2', x: 200, y: 100 },
    { id: 3, label: '项目 3', x: 300, y: 100 },
  ])
  const selectedId = createSignal<number | null>(null)

  return renderArrayKey(
    items.get,
    (item) => item.id,
    function (getItem, getIndex, itemId) {
      const isSelected = () => selectedId.get() === itemId

      return hookDrawText({
        x: () => getItem().x,
        y: () => getItem().y,
        config: () => ({ text: getItem().label }),

        draw({ path, draw }) {
          if (isSelected()) {
            hookAddRect(4)
            hookFill('#e3f2fd')
            hookStroke(2, '#2196f3')
          } else {
            hookAddRect(4)
            hookFill('#f5f5f5')
            hookStroke(1, '#ccc')
          }
          draw({ style: isSelected() ? '#1976d2' : '#333' })
        },

        onClick() {
          selectedId.set(itemId)
        },
      })
    }
  )
}
```

### 多选

```typescript
function renderMultiSelect() {
  const items = createSignal([...]) // 项目数据
  const selectedIds = createSignal(new Set<number>())

  return renderArrayKey(
    items.get,
    item => item.id,
    function (getItem, getIndex, itemId) {
      const isSelected = () => selectedIds.get().has(itemId)

      return hookDrawText({
        // ... 位置和配置

        onClick(e) {
          const selected = new Set(selectedIds.get())

          if (e.original.ctrlKey || e.original.metaKey) {
            // Ctrl/Cmd + 点击：切换选择
            if (selected.has(itemId)) {
              selected.delete(itemId)
            } else {
              selected.add(itemId)
            }
          } else {
            // 普通点击：单选
            selected.clear()
            selected.add(itemId)
          }

          selectedIds.set(selected)
        }
      })
    }
  )
}
```

### 框选

```typescript
function renderBoxSelect() {
  const items = createSignal([...]) // 项目数据
  const selectedIds = createSignal(new Set<number>())
  const selectionBox = createSignal<{
    startX: number, startY: number,
    endX: number, endY: number,
    active: boolean
  } | null>(null)

  return hookDrawRect({
    width: 800,
    height: 600,

    onPointerDown(e) {
      // 开始框选
      selectionBox.set({
        startX: e.x,
        startY: e.y,
        endX: e.x,
        endY: e.y,
        active: true
      })

      pointerMove({
        onMove(moveE) {
          const box = selectionBox.get()
          if (box) {
            selectionBox.set({
              ...box,
              endX: moveE.offsetX,
              endY: moveE.offsetY
            })
          }
        },
        onEnd() {
          // 完成框选
          const box = selectionBox.get()
          if (box) {
            const selected = new Set<number>()
            const minX = Math.min(box.startX, box.endX)
            const maxX = Math.max(box.startX, box.endX)
            const minY = Math.min(box.startY, box.endY)
            const maxY = Math.max(box.startY, box.endY)

            items.get().forEach(item => {
              if (item.x >= minX && item.x <= maxX &&
                  item.y >= minY && item.y <= maxY) {
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
      // 渲染项目
      renderArrayKey(items.get, item => item.id, ...)

      // 渲染选择框
      renderIf(
        () => selectionBox.get()?.active === true,
        function () {
          const box = selectionBox.get()!
          return hookDrawRect({
            x: Math.min(box.startX, box.endX),
            y: Math.min(box.startY, box.endY),
            width: Math.abs(box.endX - box.startX),
            height: Math.abs(box.endY - box.startY),

            draw({ path }) {
              hookAddRect()
              hookFill('rgba(33, 150, 243, 0.1)')
              hookStroke(1, '#2196f3')
            }
          })
        }
      )
    }
  })
}
```

## 连接模式

### 节点连接

```typescript
interface Connection {
  id: string
  fromId: number
  toId: number
  label: string
}

function renderConnectableNodes() {
  const nodes = createSignal([...]) // 节点数据
  const connections = createSignal<Connection[]>([])
  const dragConnection = createSignal<{
    fromId: number
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  return hookDrawRect({
    width: 800,
    height: 600,

    onPointerMove(e) {
      // 更新拖拽连接的终点
      const drag = dragConnection.get()
      if (drag) {
        dragConnection.set({
          ...drag,
          currentX: e.x,
          currentY: e.y
        })
      }
    },

    children() {
      // 渲染连接线
      renderArrayKey(
        connections.get,
        conn => conn.id,
        function (getConn) {
          const fromNode = () => nodes.get().find(n => n.id === getConn().fromId)!
          const toNode = () => nodes.get().find(n => n.id === getConn().toId)!

          return renderConnection(getConn, fromNode, toNode)
        }
      )

      // 渲染拖拽中的连接线
      renderIf(
        () => dragConnection.get() !== null,
        function () {
          const drag = dragConnection.get()!
          return hookDraw({
            draw({ ctx }) {
              ctx.strokeStyle = '#2196f3'
              ctx.lineWidth = 2
              ctx.setLineDash([5, 5])
              ctx.beginPath()
              ctx.moveTo(drag.startX, drag.startY)
              ctx.lineTo(drag.currentX, drag.currentY)
              ctx.stroke()
              ctx.setLineDash([])
            }
          })
        }
      )

      // 渲染节点
      renderArrayKey(
        nodes.get,
        node => node.id,
        function (getNode, getIndex, nodeId) {
          return hookDrawText({
            x: () => getNode().x,
            y: () => getNode().y,
            config: () => ({ text: getNode().label }),

            onPointerDown(e) {
              // 开始连接拖拽
              dragConnection.set({
                fromId: nodeId,
                startX: e.x + getNode().x,
                startY: e.y + getNode().y,
                currentX: e.x + getNode().x,
                currentY: e.y + getNode().y
              })

              e.original.stopPropagation()
            },

            onPointerUp(e) {
              // 完成连接
              const drag = dragConnection.get()
              if (drag && drag.fromId !== nodeId) {
                const newConnection: Connection = {
                  id: `conn_${Date.now()}`,
                  fromId: drag.fromId,
                  toId: nodeId,
                  label: '连接'
                }
                connections.set([...connections.get(), newConnection])
              }
              dragConnection.set(null)
            }
          })
        }
      )
    }
  })
}
```

## 编辑模式

### 就地编辑

```typescript
function renderEditableText() {
  const text = createSignal('双击编辑')
  const isEditing = createSignal(false)
  const editValue = createSignal('')

  return renderIf(
    () => !isEditing.get(),
    function () {
      // 显示模式
      return hookDrawText({
        config: () => ({ text: text.get() }),

        onDoubleClick() {
          editValue.set(text.get())
          isEditing.set(true)
        },
      })
    },
    function () {
      // 编辑模式 - 这里需要结合 DOM 输入框
      return hookDrawRect({
        width: 200,
        height: 30,

        draw({ path }) {
          hookAddRect()
          hookFill('#fff')
          hookStroke(1, '#2196f3')
        },

        children() {
          // 实际项目中可能需要创建 DOM 输入框覆盖在 Canvas 上
          hookDrawText({
            config: () => ({ text: editValue.get() + '|' }), // 模拟光标

            onKeyDown(e) {
              if (e.key === 'Enter') {
                text.set(editValue.get())
                isEditing.set(false)
              } else if (e.key === 'Escape') {
                isEditing.set(false)
              }
            },
          })
        },
      })
    }
  )
}
```

## 缩放和平移

### 视口控制

```typescript
function renderZoomPanCanvas() {
  const viewport = createSignal({
    x: 0,
    y: 0,
    scale: 1,
  })

  return renderCanvas(canvas, ({ canvas }) => {
    hookDrawRect({
      width: canvas.width,
      height: canvas.height,

      onWheel(e) {
        // 缩放
        const delta = e.original.deltaY > 0 ? 0.9 : 1.1
        const view = viewport.get()
        viewport.set({
          ...view,
          scale: Math.max(0.1, Math.min(5, view.scale * delta)),
        })
      },

      onPointerDown(e) {
        if (e.original.button === 1) {
          // 中键拖拽
          const startView = viewport.get()

          pointerMove({
            onMove(moveE) {
              const deltaX = moveE.pageX - e.original.pageX
              const deltaY = moveE.pageY - e.original.pageY

              viewport.set({
                ...startView,
                x: startView.x + deltaX,
                y: startView.y + deltaY,
              })
            },
          })
        }
      },

      children() {
        // 应用变换
        hookDraw({
          draw({ ctx }) {
            const view = viewport.get()
            ctx.translate(view.x, view.y)
            ctx.scale(view.scale, view.scale)
          },

          children() {
            // 渲染内容
            renderContent()
          },
        })
      },
    })
  })
}
```

这些交互模式涵盖了 Canvas 应用中最常见的用户交互需求，可以作为构建复杂交互式图形应用的基础。
