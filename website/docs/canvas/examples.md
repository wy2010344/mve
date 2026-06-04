# 完整示例

实际应用场景的完整代码示例。

## 基础图形绘制

```typescript
import { renderCanvas, hookDrawRect, hookDrawText, hookDraw, hookFill, hookStroke, hookAddRect } from 'mve-dom-helper/canvasRender'

const canvas = document.createElement('canvas')
canvas.width = 400
canvas.height = 300

renderCanvas(canvas, ({ canvas }) => {
  // 背景
  hookDrawRect({
    width: 400,
    height: 300,
    draw() {
      hookAddRect()
      hookFill('#f8f9fa')
    }
  })

  // 矩形
  hookDrawRect({
    x: 50,
    y: 50,
    width: 100,
    height: 80,
    draw() {
      hookAddRect(8) // 圆角矩形
      hookFill('#3498db')
      hookStroke(2, '#2980b9')
    }
  })

  // 圆形
  hookDraw({
    x: 200,
    y: 100,
    withPath: true,
    draw({ path }) {
      path.arc(0, 0, 50, 0, Math.PI * 2)
      hookFill('#e74c3c')
      hookStroke(2, '#c0392b')
    }
  })

  // 文本
  hookDrawText({
    x: 50,
    y: 200,
    config: {
      text: 'Hello Canvas!',
      fontSize: '24px',
      fillStyle: '#2c3e50'
    }
  })
})
```

## 交互式列表

```typescript
import { createSignal } from 'wy-helper'
import { renderCanvas, hookDrawRect, hookDrawText, hookFill, simpleFlex, alignSelf, hookAddRect } from 'mve-dom-helper/canvasRender'

const selectedIndex = createSignal(-1)
const items = ['项目 1', '项目 2', '项目 3', '项目 4', '项目 5']

const canvas = document.createElement('canvas')
canvas.width = 300
canvas.height = 400

renderCanvas(canvas, ({ canvas }) => {
  hookDrawRect({
    width: 300,
    height: 400,
    padding: 10,
    
    layout() {
      return simpleFlex({
        direction: 'y',
        gap: 5
      })
    },
    
    draw() {
      hookAddRect()
      hookFill('#ffffff')
      hookStroke(1, '#dee2e6')
    },
    
    children() {
      items.forEach((item, index) => {
        hookDrawRect({
          height: 60,
          alignSelf: alignSelf('stretch'),
          
          draw() {
            const isSelected = selectedIndex.get() === index
            hookAddRect(4)
            hookFill(isSelected ? '#007bff' : '#f8f9fa')
            
            if (isSelected) {
              hookStroke(2, '#0056b3')
            }
          },
          
          onClick() {
            selectedIndex.set(selectedIndex.get() === index ? -1 : index)
          },
          
          children() {
            hookDrawText({
              config: {
                text: item,
                fontSize: '18px',
                fillStyle: () => selectedIndex.get() === index ? '#ffffff' : '#495057',
                fontWeight: 'bold'
              },
              alignSelf: alignSelf('center')
            })
          }
        })
      })
    }
  })
})
```

## 数据可视化

```typescript
import { createSignal } from 'wy-helper'
import { renderCanvas, hookDrawRect, hookDrawText, hookFill, hookStroke, simpleFlex, alignSelf, hookAddRect } from 'mve-dom-helper/canvasRender'

interface DataPoint {
  label: string
  value: number
  color: string
}

const data = createSignal<DataPoint[]>([
  { label: 'A', value: 30, color: '#3498db' },
  { label: 'B', value: 80, color: '#e74c3c' },
  { label: 'C', value: 45, color: '#2ecc71' },
  { label: 'D', value: 60, color: '#f39c12' },
  { label: 'E', value: 20, color: '#9b59b6' }
])

const maxValue = () => Math.max(...data.get().map(d => d.value))
const chartHeight = 250

const canvas = document.createElement('canvas')
canvas.width = 500
canvas.height = 350

renderCanvas(canvas, ({ canvas }) => {
  hookDrawRect({
    width: 500,
    height: 350,
    padding: 30,
    
    layout() {
      return simpleFlex({
        direction: 'y',
        gap: 20
      })
    },
    
    draw() {
      hookAddRect()
      hookFill('#ffffff')
    },
    
    children() {
      // 标题
      hookDrawText({
        config: {
          text: '数据可视化示例',
          fontSize: '20px',
          fillStyle: '#2c3e50',
          fontWeight: 'bold'
        },
        alignSelf: alignSelf('center')
      })

      // 图表区域
      hookDrawRect({
        height: chartHeight,
        alignSelf: alignSelf('stretch'),
        
        layout() {
          return simpleFlex({
            direction: 'x',
            alignItems: 'end',
            gap: 10,
            directionFix: 'center'
          })
        },
        
        children() {
          data.get().forEach((item, index) => {
            const barHeight = (item.value / maxValue()) * chartHeight
            
            hookDrawRect({
              width: 60,
              height: barHeight,
              
              draw() {
                hookAddRect()
                hookFill(item.color)
                hookStroke(1, '#34495e')
              },
              
              onClick() {
                console.log(`点击了 ${item.label}: ${item.value}`)
              },
              
              children() {
                // 数值标签
                hookDrawText({
                  config: {
                    text: item.value.toString(),
                    fontSize: '12px',
                    fillStyle: '#ffffff',
                    fontWeight: 'bold'
                  },
                  alignSelf: alignSelf('center'),
                  y: -20
                })
              }
            })
          })
        }
      })

      // X 轴标签
      hookDrawRect({
        height: 30,
        alignSelf: alignSelf('stretch'),
        
        layout() {
          return simpleFlex({
            direction: 'x',
            alignItems: 'center',
            gap: 10,
            directionFix: 'center'
          })
        },
        
        children() {
          data.get().forEach(item => {
            hookDrawRect({
              width: 60,
              height: 30,
              
              children() {
                hookDrawText({
                  config: {
                    text: item.label,
                    fontSize: '14px',
                    fillStyle: '#7f8c8d'
                  },
                  alignSelf: alignSelf('center')
                })
              }
            })
          })
        }
      })
    }
  })
})
```

## 动画效果

```typescript
import { createSignal } from 'wy-helper'
import { renderCanvas, hookDrawRect, hookDraw, hookFill } from 'mve-dom-helper/canvasRender'

const rotation = createSignal(0)
const dots = Array.from({ length: 8 }, (_, i) => ({
  angle: (i * Math.PI * 2) / 8,
  delay: i * 100
}))

// 动画循环
function animate() {
  rotation.set(rotation.get() + 0.1)
  requestAnimationFrame(animate)
}
animate()

const canvas = document.createElement('canvas')
canvas.width = 200
canvas.height = 200

renderCanvas(canvas, ({ canvas }) => {
  hookDrawRect({
    width: 200,
    height: 200,
    
    draw() {
      hookAddRect()
      hookFill('#f8f9fa')
    },
    
    children() {
      // 中心点
      hookDraw({
        x: 100,
        y: 100,
        
        children() {
          dots.forEach((dot, index) => {
            hookDraw({
              x: () => Math.cos(dot.angle + rotation.get()) * 40,
              y: () => Math.sin(dot.angle + rotation.get()) * 40,
              withPath: true,
              
              draw({ ctx, path }) {
                const opacity = (Math.sin(rotation.get() * 2 + dot.delay / 100) + 1) / 2
                ctx.globalAlpha = opacity * 0.8 + 0.2
                
                path.arc(0, 0, 6, 0, Math.PI * 2)
                hookFill('#3498db')
                
                ctx.globalAlpha = 1
              }
            })
          })
        }
      })
    }
  })
})
```

## 文本编辑器

```typescript
import { createSignal } from 'wy-helper'
import { renderCanvas, hookDrawTextWrap, hookAddRect, hookStroke, hookCurrentCtx } from 'mve-dom-helper/canvasRender'

const text = createSignal('可编辑的文本内容...')
const selectStart = createSignal(0)
const selectEnd = createSignal(0)

const canvas = document.createElement('canvas')
canvas.width = 400
canvas.height = 300

renderCanvas(canvas, ({ canvas }) => {
  const textNode = hookDrawTextWrap({
    width: 360,
    padding: 20,
    config: () => ({
      text: text.get(),
      fontSize: '16px',
      lineHeight: 1.5
    }),
    
    draw(e) {
      hookAddRect()
      e.draw() // 绘制文本
      hookStroke(1, '#ddd')
      
      // 绘制选择区域
      const ctx = hookCurrentCtx()
      ctx.fillStyle = 'rgba(0, 120, 215, 0.3)'
      const helper = textNode.helper.withSelect(selectStart.get, selectEnd.get)
      helper.draw(ctx)
    },
    
    onPointerDown(e) {
      const helper = textNode.helper.withSelect(selectStart.get, selectEnd.get)
      const index = helper.getIndex(e)
      selectStart.set(index)
      selectEnd.set(index)
    }
  })
})
```