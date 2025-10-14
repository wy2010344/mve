# mve-dom-helper

DOM-specific helper utilities for MVE framework, providing advanced DOM manipulation and utility
functions.

## Installation

```bash
npm install mve-dom-helper
# or
pnpm add mve-dom-helper
# or
yarn add mve-dom-helper
```

## Peer Dependencies

- `history` ^5.3.0
- `mve-core` (workspace dependency)
- `mve-dom` (workspace dependency)
- `mve-helper` (workspace dependency)
- `wy-dom-helper` (workspace dependency)
- `wy-helper` (workspace dependency)

## Features

- **Canvas Rendering** - Canvas-based rendering utilities
- **History Management** - Browser history integration
- **DOM Utilities** - Advanced DOM manipulation helpers
- **Animation Support** - Animation and transition utilities
- **Layout Helpers** - Layout calculation and management tools

## Submodule Exports

- `mve-dom-helper/canvasRender` - Canvas rendering functionality
- `mve-dom-helper/history` - History management utilities

## Usage

```typescript
// Import from main module
import {} from /* DOM helper utilities */ 'mve-dom-helper';

// Import specific modules
import {} from /* canvas utilities */ 'mve-dom-helper/canvasRender';
import {} from /* history utilities */ 'mve-dom-helper/history';
```

## Canvas Rendering

```typescript
import { createCanvasRenderer } from 'mve-dom-helper/canvasRender';

const renderer = createCanvasRenderer(canvas);
renderer.drawRect(0, 0, 100, 100, { fill: 'red' });
```

## History Management

```typescript
import { createRouter } from 'mve-dom-helper/history';

const router = createRouter({
  '/': () => import('./pages/Home'),
  '/about': () => import('./pages/About'),
});
```

## API Documentation

For detailed API documentation, visit [online docs](https://wy2010344.github.io/mve).

## Development

See the [main README](../README.md) for development setup instructions.

## License

MIT
