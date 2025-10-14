# mve-dom

DOM renderer for MVE framework, providing efficient DOM manipulation and rendering capabilities.

## Installation

```bash
npm install mve-dom
# or
pnpm add mve-dom
# or
yarn add mve-dom
```

## Peer Dependencies

- `mve-core` (workspace dependency)
- `mve-helper` (workspace dependency)
- `wy-dom-helper` (workspace dependency)
- `wy-helper` (workspace dependency)

## Features

- **Efficient DOM Rendering** - Optimized DOM updates using signals
- **Virtual DOM** - Lightweight virtual DOM implementation
- **Event Handling** - Comprehensive event management system
- **Server-Side Rendering** - SSR support for universal applications
- **Portal Support** - Render components outside their parent tree

## Usage

```typescript
import { render, h, Fragment } from 'mve-dom';
import { createSignal } from 'mve-core';

// Create a simple component
function Counter() {
  const [count, setCount] = createSignal(0);

  return h('div', {}, [
    h('p', {}, `Count: ${count()}`),
    h(
      'button',
      {
        onClick: () => setCount(count() + 1),
      },
      'Increment'
    ),
  ]);
}

// Render to DOM
render(Counter, document.getElementById('app'));
```

## JSX Support

```tsx
import { render } from 'mve-dom';
import { createSignal } from 'mve-core';

function App() {
  const [count, setCount] = createSignal(0);

  return (
    <div>
      <h1>MVE Counter</h1>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
}

render(<App />, document.getElementById('app'));
```

## Core APIs

### Rendering

- `render(component, container)` - Render component to DOM
- `h(tag, props, children)` - Create virtual DOM elements
- `Fragment` - Group multiple elements without wrapper

### Components

- `createComponent(fn)` - Create reusable components
- `createPortal(children, container)` - Render outside parent tree

### Lifecycle

- `onMount(fn)` - Run function when component mounts
- `onCleanup(fn)` - Run function when component unmounts

## API Documentation

For detailed API documentation, visit [online docs](https://wy2010344.github.io/mve).

## Development

See the [main README](../README.md) for development setup instructions.

## License

MIT
