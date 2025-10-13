# 响应式数据模型

Canvas 系统与信号系统深度集成，支持响应式数据驱动的图形渲染。

## 数据模型设计

### 创建响应式模型

将静态数据转换为响应式信号模型：

```typescript
import { createSignal } from 'wy-helper'

// 静态数据
interface NodeData {
  id: number
  label: string
  x: number
  y: number
  type: 'normal' | 'start' | 'end'
}

// 响应式模型
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

### 响应式集合管理

```typescript
const nodes = createSignal<NodeModel[]>([])
const selectedNodeId = createSignal<number | null>(null)

// 添加节点
function addNode(data: NodeData) {
  const newNode = createNodeModel(data)
  nodes.set([...nodes.get(), newNode])
}

// 删除节点
function removeNode(id: number) {
  nodes.set(nodes.get().filter(n => n.id !== id))
}

// 更新节点
function updateNode(id: number, updates: Partial<NodeData>) {
  const node = nodes.get().find(n => n.id === id)
  if (node) {
    if (updates.x !== undefined) node.x.set(updates.x)
    if (updates.y !== undefined) node.y.set(updates.y)
    if (updates.label !== undefined) node.label.set(updates.label)
  }
}
```

## 高效渲染

### renderArrayKey

使用 `renderArrayKey` 进行高效的列表渲染：

```typescript
import { renderArrayKey } from 'mve-helper'

// 渲染节点列表
renderArrayKey(
  nodes.get, // 获取数组的函数
  (node) => node.id, // 键函数
  function (getNode, getIndex, nodeId) {
    // 渲染单个节点
    renderNode(
      getNode, // 获取当前节点的函数
      () => selectedNodeId.get() === nodeId, // 是否选中
      (e) => {
        selectedNodeId.set(nodeId)
        return true // 阻止事件冒泡
      }
    )
  }
)
```

### 条件渲染

使用 `renderIf` 进行条件渲染：

```typescript
import { renderIf } from 'mve-helper'

renderIf(
  () => selectedNodeId.get() !== null,
  function () {
    // 渲染选中状态的工具栏
    renderToolbar()
  }
)
```

## 交互实现

### 拖拽功能

```typescript
import { pointerMove } from 'wy-dom-helper'

function renderDraggableNode(getNode: () => NodeModel) {
  return hookDrawText({
    x: () => getNode().x.get(),
    y: () => getNode().y.get(),
    config: () => ({
      text: getNode().label.get()
    }),
    
    onPointerDown(e) {
      const node = getNode()
      const startX = node.x.get()
      const startY = node.y.get()
      
      pointerMove({
        onMove(moveE) {
          const deltaX = moveE.pageX - e.original.pageX
          const deltaY = moveE.pageY - e.original.pageY
          node.x.set(startX + deltaX)
          node.y.set(startY + deltaY)
        },
        onEnd() {
          // 拖拽结束处理
        }
      })
    }
  })
}
```

### 选择状态管理

```typescript
function renderSelectableNode(
  getNode: () => NodeModel,
  isSelected: () => boolean,
  onSelect: (e: CanvasMouseEvent) => void
) {
  return hookDrawText({
    config: () => ({
      text: getNode().label.get()
    }),
    
    draw({ path, draw }) {
      // 根据选择状态改变样式
      if (isSelected()) {
        hookAddRect(8)
        hookFill('#e3f2fd')
        hookStroke(2, '#2196f3')
      } else {
        hookAddRect(8)
        hookFill('#f5f5f5')
        hookStroke(1, '#ccc')
      }
      
      draw({
        style: isSelected() ? '#1976d2' : '#333'
      })
    },
    
    onClick: onSelect
  })
}
```

## 数据持久化

### 序列化和反序列化

```typescript
// 序列化为 JSON
function serializeNodes(nodes: NodeModel[]): NodeData[] {
  return nodes.map(node => ({
    id: node.id,
    label: node.label.get(),
    x: node.x.get(),
    y: node.y.get(),
    type: node.type
  }))
}

// 从 JSON 恢复
function deserializeNodes(data: NodeData[]): NodeModel[] {
  return data.map(createNodeModel)
}

// 保存到本地存储
function saveToStorage() {
  const data = serializeNodes(nodes.get())
  localStorage.setItem('canvas-data', JSON.stringify(data))
}

// 从本地存储加载
function loadFromStorage() {
  const json = localStorage.getItem('canvas-data')
  if (json) {
    const data = JSON.parse(json) as NodeData[]
    nodes.set(deserializeNodes(data))
  }
}
```

## 性能优化

### 批量更新

```typescript
import { batch } from 'wy-helper'

// 批量更新多个属性
function updateNodeBatch(node: NodeModel, updates: {
  x?: number
  y?: number
  label?: string
}) {
  batch(() => {
    if (updates.x !== undefined) node.x.set(updates.x)
    if (updates.y !== undefined) node.y.set(updates.y)
    if (updates.label !== undefined) node.label.set(updates.label)
  })
}
```

### 计算属性缓存

```typescript
import { memo } from 'wy-helper'

// 缓存复杂计算
const boundingBox = memo(() => {
  const nodeList = nodes.get()
  if (nodeList.length === 0) return { x: 0, y: 0, width: 0, height: 0 }
  
  let minX = Infinity, minY = Infinity
  let maxX = -Infinity, maxY = -Infinity
  
  nodeList.forEach(node => {
    const x = node.x.get()
    const y = node.y.get()
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  })
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
})
```

## 最佳实践

1. **数据驱动**: 将所有可变状态转换为信号
2. **模型分离**: 将数据模型与视图逻辑分离
3. **高效渲染**: 使用 `renderArrayKey` 避免不必要的重新创建
4. **批量更新**: 使用 `batch` 进行批量状态更新
5. **缓存计算**: 使用 `memo` 缓存复杂计算结果
6. **事件处理**: 合理使用 `pointerMove` 等工具函数