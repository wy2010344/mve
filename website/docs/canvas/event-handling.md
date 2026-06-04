# 事件处理

Canvas 节点支持完整的鼠标和指针事件处理。

## 支持的事件

只有 `withPath: true` 的节点才支持事件处理：

```typescript
hookDraw({
  withPath: true,
  onClick(e) { /* 点击事件 */ },
  onMouseDown(e) { /* 鼠标按下 */ },
  onMouseUp(e) { /* 鼠标释放 */ },
  onPointerDown(e) { /* 指针按下 */ },
  onPointerUp(e) { /* 指针释放 */ },
  
  // 捕获阶段事件
  onClickCapture(e) { /* 捕获阶段点击 */ },
  onPointerDownCapture(e) { /* 捕获阶段指针按下 */ },
})
```

## 事件对象

```typescript
interface CanvasMouseEvent<T> {
  x: number        // 相对于当前节点的坐标
  y: number        // 相对于当前节点的坐标
  inPath: boolean  // 是否在路径内
  inStroke: boolean // 是否在描边上
  original: T      // 原始 DOM 事件
  node: CNode      // 触发事件的节点
}
```

## 基础交互

**点击响应**：

```typescript
hookDrawRect({
  width: 100,
  height: 50,
  draw({ path }) {
    hookAddRect()
    hookFill('#3498db')
  },
  onClick(e) {
    console.log(`点击位置: (${e.x}, ${e.y})`)
    console.log(`在路径内: ${e.inPath}`)
  }
})
```

**悬停效果**：

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

## 拖拽实现

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
      position.set({
        x: globalE.clientX - startX,
        y: globalE.clientY - startY
      })
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

## 事件冒泡

Canvas 事件系统支持事件冒泡：

```typescript
// 父容器
hookDrawRect({
  width: 200,
  height: 200,
  
  onClickCapture(e) {
    console.log('父容器捕获阶段')
    // 可以阻止事件继续传播
  },
  
  onClick(e) {
    console.log('父容器冒泡阶段')
  },
  
  children() {
    // 子元素
    hookDrawRect({
      width: 100,
      height: 100,
      x: 50,
      y: 50,
      
      onClick(e) {
        console.log('子元素点击')
        // 事件会继续冒泡到父容器
      }
    })
  }
})
```

## 多选功能

```typescript
const selectedItems = createSignal(new Set<number>())

hookDrawRect({
  width: 400,
  height: 300,
  layout() {
    return simpleFlex({ direction: 'y', gap: 5 })
  },
  
  children() {
    for (let i = 0; i < 5; i++) {
      hookDrawRect({
        height: 50,
        alignSelf: alignSelf('stretch'),
        
        draw() {
          const isSelected = selectedItems.get().has(i)
          hookAddRect()
          hookFill(isSelected ? '#e74c3c' : '#ecf0f1')
        },
        
        onClick(e) {
          const selected = new Set(selectedItems.get())
          
          if (e.original.ctrlKey || e.original.metaKey) {
            // Ctrl/Cmd + 点击：切换选择
            if (selected.has(i)) {
              selected.delete(i)
            } else {
              selected.add(i)
            }
          } else {
            // 普通点击：单选
            selected.clear()
            selected.add(i)
          }
          
          selectedItems.set(selected)
        },
        
        children() {
          hookDrawText({
            config: {
              text: `项目 ${i + 1}`,
              fillStyle: () => selectedItems.get().has(i) ? '#fff' : '#333'
            },
            alignSelf: alignSelf('center')
          })
        }
      })
    }
  }
})
```

## 性能优化

对于大量交互元素，使用事件委托：

```typescript
hookDrawRect({
  width: 400,
  height: 400,
  
  onClick(e) {
    // 根据点击位置判断具体元素
    const itemIndex = Math.floor(e.y / 50)
    console.log(`点击了第 ${itemIndex} 个项目`)
  },
  
  children() {
    // 大量子元素，不需要单独的事件处理器
    for (let i = 0; i < 100; i++) {
      hookDrawRect({
        y: i * 50,
        height: 50,
        alignSelf: alignSelf('stretch')
        // 不添加 onClick，由父容器处理
      })
    }
  }
})
```