# mve-core

Core framework for MVE (Model-View-Effect) architecture with signal-based reactivity.

## Installation

```bash
npm install mve-core
# or
pnpm add mve-core
# or
yarn add mve-core
```

## Peer Dependencies

- `wy-helper` (workspace dependency)

## Features

- **Signal-based Reactivity** - Efficient reactive system using signals
- **Model-View-Effect Architecture** - Clean separation of concerns
- **Lightweight Core** - Minimal footprint with maximum performance
- **TypeScript Support** - Full TypeScript support with type safety

## Usage

```typescript
import { createSignal, effect, computed } from 'mve-core';

// Create reactive signals
const [count, setCount] = createSignal(0);
const [name, setName] = createSignal('World');

// Create computed values
const greeting = computed(() => `Hello, ${name()}!`);

// Create effects
effect(() => {
  console.log(`Count: ${count()}, ${greeting()}`);
});

// Update signals
setCount(1); // Logs: "Count: 1, Hello, World!"
setName('MVE'); // Logs: "Count: 1, Hello, MVE!"
```

## Core Concepts

### Signals

Signals are reactive primitives that hold values and notify dependents when changed.

### Effects

Effects are functions that run when their dependencies change.

### Computed Values

Computed values are derived from other signals and update automatically.

## API Documentation

For detailed API documentation, visit [online docs](https://wy2010344.github.io/mve).

## Development

See the [main README](../README.md) for development setup instructions.

## License

MIT
