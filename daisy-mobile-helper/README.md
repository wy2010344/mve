# daisy-mobile-helper

Mobile UI components and helpers using DaisyUI and MVE framework for building responsive mobile
applications.

## Installation

```bash
npm install daisy-mobile-helper
# or
pnpm add daisy-mobile-helper
# or
yarn add daisy-mobile-helper
```

## Peer Dependencies

- `history` ^5.3.0
- `mve-core` (workspace dependency)
- `mve-dom` (workspace dependency)
- `mve-dom-helper` (workspace dependency)
- `mve-helper` (workspace dependency)
- `mve-icons` ^6.0.0
- `wy-dom-helper` (workspace dependency)
- `wy-helper` (workspace dependency)

## Features

- **Mobile-First Components** - Responsive UI components optimized for mobile
- **DaisyUI Integration** - Beautiful components using DaisyUI design system
- **Touch Gestures** - Touch and gesture support for mobile interactions
- **Responsive Design** - Adaptive layouts for different screen sizes
- **Accessibility** - WCAG compliant components with proper ARIA support

## Dependencies

- **TailwindCSS** - Utility-first CSS framework
- **DaisyUI** - Component library for TailwindCSS
- **Motion** - Animation library for smooth transitions
- **Tyme4ts** - Date and time utilities

## Usage

```typescript
import {
  MobileButton,
  MobileCard,
  MobileModal,
  MobileNavigation
} from 'daisy-mobile-helper';

// Create mobile-optimized components
function App() {
  return (
    <div class="mobile-app">
      <MobileNavigation title="My App" />

      <MobileCard>
        <h2>Welcome</h2>
        <p>This is a mobile-optimized card component.</p>

        <MobileButton
          variant="primary"
          size="large"
          onClick={() => console.log('Clicked!')}
        >
          Get Started
        </MobileButton>
      </MobileCard>

      <MobileModal open={showModal()}>
        <p>Mobile-friendly modal content</p>
      </MobileModal>
    </div>
  );
}
```

## Component Categories

### Navigation

- `MobileNavigation` - Mobile navigation bar
- `MobileTabBar` - Bottom tab navigation
- `MobileBreadcrumb` - Breadcrumb navigation

### Layout

- `MobileContainer` - Responsive container
- `MobileGrid` - Mobile-optimized grid system
- `MobileCard` - Card component for mobile

### Input

- `MobileButton` - Touch-optimized buttons
- `MobileInput` - Mobile-friendly input fields
- `MobileSelect` - Dropdown select component

### Feedback

- `MobileModal` - Mobile modal dialogs
- `MobileToast` - Toast notifications
- `MobileLoading` - Loading indicators

## Styling

The components use DaisyUI themes and can be customized through CSS variables:

```css
:root {
  --mobile-primary: #3b82f6;
  --mobile-secondary: #64748b;
  --mobile-accent: #f59e0b;
}
```

## API Documentation

For detailed API documentation, visit [online docs](https://wy2010344.github.io/mve).

## Development

See the [main README](../README.md) for development setup instructions.

## License

MIT
