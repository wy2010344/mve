# Canvas Rendering System

MVE Canvas is a lightweight 2D rendering system integrated with a signal-based reactive data model.

## Quick Start

```typescript
import { renderCanvas, hookDrawRect, hookFill } from 'mve-dom-helper/canvasRender'

export default function CanvasDemo() {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300

  renderCanvas(canvas, ({ canvas }) => {
    hookDrawRect({
      x: 50,
      y: 50,
      width: 100,
      height: 80,
      withPath: true,
      draw({ path }) {
        path.rect(0, 0, 100, 80)
        hookFill('#3498db')
      }
    })
  })
}
```

## Core Concepts

### Node Types
- **hookDraw**: Base draw node with position and event support
- **hookDrawRect**: Rectangle node with layout system integration
- **hookDrawText**: Single-line text node (based on hookDrawRect), auto-sized by text content
- **hookDrawTextWrap**: Word-wrap text node (based on hookDrawRect), wraps text within given width
- **hookDrawImage**: Image node (based on hookDrawRect), sized by image dimensions
- **hookDrawUrlImage**: Remote image node (based on hookDrawImage), loads from URL

### Draw Modes
- `withPath: false` (default): No mouse/touch event detection
- `withPath: true`: Enables event detection via Path2D; must add paths to the path object

## Navigation

- [Basic API](./basic-api) - Core render functions and node types
- [Responsive Data](./responsive-data) - Signal-driven data model design
- [Interactive Patterns](./interactive-patterns) - Drag, select, connect patterns
- [Text Rendering](./text-rendering) - Text drawing and measurement
- [Drawing Tools](./drawing-tools) - Fill, stroke, clip utilities
- [Layout System](./layout-system) - Responsive flex layout
- [Event Handling](./event-handling) - Interaction events
- [Performance](./performance) - Optimization techniques
- [Examples](./examples) - Real-world usage
