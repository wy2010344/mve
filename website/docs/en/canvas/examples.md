# Examples

Essential real-world usage examples.

## Basic Shapes

```typescript
import { renderCanvas, hookDrawRect, hookDrawText, hookDraw, hookFill, hookStroke, hookAddRect } from 'mve-dom-helper/canvasRender'

const canvas = document.createElement('canvas')
canvas.width = 400
canvas.height = 300

renderCanvas(canvas, ({ canvas }) => {
  hookDrawRect({ width: 400, height: 300, draw() { hookAddRect(); hookFill('#f8f9fa') } })

  hookDrawRect({ x: 50, y: 50, width: 100, height: 80, draw() { hookAddRect(8); hookFill('#3498db'); hookStroke(2, '#2980b9') } })

  hookDraw({ x: 200, y: 100, withPath: true, draw({ path }) { path.arc(0, 0, 50, 0, Math.PI * 2); hookFill('#e74c3c'); hookStroke(2, '#c0392b') } })

  hookDrawText({ x: 50, y: 200, config: { text: 'Hello Canvas!', fontSize: '24px', fillStyle: '#2c3e50' } })
})
```

## Interactive List

```typescript
import { createSignal } from 'wy-helper'
import { renderCanvas, hookDrawRect, hookDrawText, hookFill, simpleFlex, alignSelf, hookAddRect } from 'mve-dom-helper/canvasRender'

const selectedIndex = createSignal(-1)
const items = ['item 1', 'item 2', 'item 3', 'item 4', 'item 5']

const canvas = document.createElement('canvas')
canvas.width = 300
canvas.height = 400

renderCanvas(canvas, ({ canvas }) => {
  hookDrawRect({
    width: 300, height: 400, padding: 10,
    layout() { return simpleFlex({ direction: 'y', gap: 5 }) },
    draw() { hookAddRect(); hookFill('#ffffff'); hookStroke(1, '#dee2e6') },
    children() {
      items.forEach((item, index) => {
        hookDrawRect({
          height: 60, alignSelf: alignSelf('stretch'),
          draw() {
            const isSelected = selectedIndex.get() === index
            hookAddRect(4)
            hookFill(isSelected ? '#007bff' : '#f8f9fa')
            if (isSelected) hookStroke(2, '#0056b3')
          },
          onClick() { selectedIndex.set(selectedIndex.get() === index ? -1 : index) },
          children() {
            hookDrawText({ config: { text: item, fontSize: '18px', fillStyle: () => selectedIndex.get() === index ? '#fff' : '#495057', fontWeight: 'bold' }, alignSelf: alignSelf('center') })
          }
        })
      })
    }
  })
})
```

## Data Visualization

```typescript
import { createSignal } from 'wy-helper'
import { renderCanvas, hookDrawRect, hookDrawText, hookFill, hookStroke, simpleFlex, alignSelf, hookAddRect } from 'mve-dom-helper/canvasRender'

interface DataPoint { label: string; value: number; color: string }

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
    width: 500, height: 350, padding: 30,
    layout() { return simpleFlex({ direction: 'y', gap: 20 }) },
    draw() { hookAddRect(); hookFill('#ffffff') },
    children() {
      hookDrawText({ config: { text: 'Data Visualization', fontSize: '20px', fillStyle: '#2c3e50', fontWeight: 'bold' }, alignSelf: alignSelf('center') })

      hookDrawRect({
        height: chartHeight, alignSelf: alignSelf('stretch'),
        layout() { return simpleFlex({ direction: 'x', alignItems: 'end', gap: 10, directionFix: 'center' }) },
        children() {
          data.get().forEach(item => {
            const barHeight = (item.value / maxValue()) * chartHeight
            hookDrawRect({
              width: 60, height: barHeight,
              draw() { hookAddRect(); hookFill(item.color); hookStroke(1, '#34495e') },
              onClick() { console.log(`clicked ${item.label}: ${item.value}`) },
              children() { hookDrawText({ config: { text: item.value.toString(), fontSize: '12px', fillStyle: '#fff', fontWeight: 'bold' }, alignSelf: alignSelf('center'), y: -20 }) }
            })
          })
        }
      })

      hookDrawRect({
        height: 30, alignSelf: alignSelf('stretch'),
        layout() { return simpleFlex({ direction: 'x', alignItems: 'center', gap: 10, directionFix: 'center' }) },
        children() {
          data.get().forEach(item => {
            hookDrawRect({ width: 60, height: 30, children() { hookDrawText({ config: { text: item.label, fontSize: '14px', fillStyle: '#7f8c8d' }, alignSelf: alignSelf('center') }) } })
          })
        }
      })
    }
  })
})
```
