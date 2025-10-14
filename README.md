# MVE Framework

A signal-based frontend framework for building reactive user interfaces.

## Packages

- **mve-core** - Core MVE framework with signal-based reactivity
- **mve-helper** - Helper utilities for MVE framework
- **mve-dom** - DOM renderer for MVE framework
- **mve-dom-helper** - DOM-specific helper utilities
- **daisy-mobile-helper** - Mobile UI components using DaisyUI

## Documentation

📖 Documentation: https://wy2010344.github.io/mve (Work in progress)

## Development

This project is part of a pseudo monorepo setup. To contribute:

1. Clone the pseudo monorepo:

   ```bash
   git clone https://github.com/wy2010344/es-pseudo-monorepo.git
   cd es-pseudo-monorepo
   ```

2. Clone this project into the packages directory:

   ```bash
   cd packages
   git clone https://github.com/wy2010344/mve.git
   cd mve
   ```

3. Install dependencies from the monorepo root:

   ```bash
   cd ../..
   pnpm install
   ```

4. Build and test:
   ```bash
   cd packages/mve
   pnpm run build
   pnpm run lint:check
   pnpm run type-check
   ```

## Publishing

From the monorepo root:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```

## License

MIT
