# Responsive Data

The Canvas system integrates deeply with the signal system for reactive data-driven rendering.

## Creating Reactive Models

Convert static data to reactive signal models:

```typescript
import { createSignal } from 'wy-helper'

interface NodeData {
  id: number
  label: string
  x: number
  y: number
}

function createNodeModel(data: NodeData) {
  return {
    ...data,
    x: createSignal(data.x),
    y: createSignal(data.y),
    label: createSignal(data.label),
    selected: createSignal(false)
  }
}

type NodeModel = ReturnType<typeof createNodeModel>
```

## Reactive Collection Management

```typescript
const nodes = createSignal<NodeModel[]>([])
const selectedNodeId = createSignal<number | null>(null)

function addNode(data: NodeData) {
  nodes.set([...nodes.get(), createNodeModel(data)])
}

function removeNode(id: number) {
  nodes.set(nodes.get().filter(n => n.id !== id))
}

function updateNode(id: number, updates: Partial<NodeData>) {
  const node = nodes.get().find(n => n.id === id)
  if (node) {
    if (updates.x !== undefined) node.x.set(updates.x)
    if (updates.y !== undefined) node.y.set(updates.y)
    if (updates.label !== undefined) node.label.set(updates.label)
  }
}
```

## renderArrayKey

Efficient list rendering with keyed reconciliation:

```typescript
import { renderArrayKey } from 'mve-helper'

renderArrayKey(
  nodes.get,
  (node) => node.id,
  function (getNode, getIndex, nodeId) {
    renderNode(getNode, () => selectedNodeId.get() === nodeId)
  }
)
```

## Conditional Rendering

Use `renderIf` for conditional rendering:

```typescript
import { renderIf } from 'mve-helper'

renderIf(
  () => selectedNodeId.get() !== null,
  function () { renderToolbar() }
)
```

## Drag Example

```typescript
import { pointerMove } from 'wy-dom-helper'

function renderDraggableNode(getNode: () => NodeModel) {
  return hookDrawText({
    x: () => getNode().x.get(),
    y: () => getNode().y.get(),
    config: () => ({ text: getNode().label.get() }),
    onPointerDown(e) {
      const node = getNode()
      const startX = node.x.get()
      const startY = node.y.get()
      pointerMove({
        onMove(moveE) {
          node.x.set(startX + (moveE.pageX - e.original.pageX))
          node.y.set(startY + (moveE.pageY - e.original.pageY))
        }
      })
    }
  })
}
```

## Serialization

```typescript
function serializeNodes(nodes: NodeModel[]): NodeData[] {
  return nodes.map(node => ({
    id: node.id,
    label: node.label.get(),
    x: node.x.get(),
    y: node.y.get()
  }))
}

function deserializeNodes(data: NodeData[]): NodeModel[] {
  return data.map(createNodeModel)
}

function saveToStorage() {
  localStorage.setItem('canvas-data', JSON.stringify(serializeNodes(nodes.get())))
}

function loadFromStorage() {
  const json = localStorage.getItem('canvas-data')
  if (json) nodes.set(deserializeNodes(JSON.parse(json)))
}
```

## Batch Updates

```typescript
import { batch } from 'wy-helper'

function updateNodeBatch(node: NodeModel, updates: { x?: number, y?: number, label?: string }) {
  batch(() => {
    if (updates.x !== undefined) node.x.set(updates.x)
    if (updates.y !== undefined) node.y.set(updates.y)
    if (updates.label !== undefined) node.label.set(updates.label)
  })
}
```

## Memo

```typescript
import { memo } from 'wy-helper'

const boundingBox = memo(() => {
  const nodeList = nodes.get()
  if (nodeList.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  nodeList.forEach(node => {
    minX = Math.min(minX, node.x.get())
    minY = Math.min(minY, node.y.get())
    maxX = Math.max(maxX, node.x.get())
    maxY = Math.max(maxY, node.y.get())
  })
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
})
```
