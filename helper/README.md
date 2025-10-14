# mve-helper

Helper utilities for MVE framework providing additional functionality and convenience methods.

## Installation

```bash
npm install mve-helper
# or
pnpm add mve-helper
# or
yarn add mve-helper
```

## Peer Dependencies

- `mve-core` (workspace dependency)
- `wy-helper` (workspace dependency)

## Features

- **State Management Helpers** - Utilities for managing complex state
- **Component Utilities** - Helper functions for component development
- **Reactive Utilities** - Additional reactive programming helpers
- **Performance Optimizations** - Tools for optimizing MVE applications

## Usage

```typescript
import { createStore, useSignal, batch, createResource } from 'mve-helper';

// Create a store for complex state management
const store = createStore({
  count: 0,
  user: { name: 'John', age: 30 },
});

// Use helper hooks
const [value, setValue] = useSignal(0);

// Batch multiple updates
batch(() => {
  setValue(1);
  store.count = 10;
});

// Create async resources
const [data] = createResource(() => fetch('/api/data'));
```

## Helper Categories

### State Management

- `createStore` - Create reactive stores
- `useSignal` - Signal hook utility
- `batch` - Batch multiple updates

### Component Helpers

- `createComponent` - Component creation utilities
- `createContext` - Context management
- `useContext` - Context consumption

### Performance

- `memo` - Memoization utilities
- `lazy` - Lazy loading helpers
- `suspense` - Suspense utilities

## API Documentation

For detailed API documentation, visit [online docs](https://wy2010344.github.io/mve).

## Development

See the [main README](../README.md) for development setup instructions.

## License

MIT
