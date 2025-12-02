# Getting Started

This guide is based on real MVE project development patterns to help you quickly get started and build real applications.

## Environment Setup

### System Requirements

- Node.js 16+
- Modern browsers (supporting ES2020)
- TypeScript 4.5+ (recommended)

### Create a New Project

Create a project using Vite (recommended, consistent with real projects):

```bash
npm create vite@latest my-mve-app -- --template vanilla-ts
cd my-mve-app
npm install
```

### Install MVE Core Dependencies

```bash
npm install wy-helper wy-dom-helper mve-core mve-helper mve-dom mve-dom-helper
```

### Install Recommended Styling Solution

Based on real project experience, we recommend using Tailwind CSS + DaisyUI:

```bash
# Styling framework (standard for real projects)
npm install tailwindcss daisyui @tailwindcss/vite

# Mobile development helper library (commonly used in real projects)
npm install daisy-mobile-helper

# Icon library (essential for real projects)
npm install mve-icons

# Routing and history management (required for real projects)
npm install history
```

## Project Structure

Recommended structure based on real MVE projects:

```
my-mve-app/
├── src/
│   ├── components/          # Reusable components
│   │   ├── form-card.ts
│   │   ├── dialog.ts
│   │   └── layout.ts
│   ├── pages/              # Page components (file-based routing)
│   │   ├── home/
│   │   │   ├── index.ts    # Home page
│   │   │   └── layout.ts   # Home page layout
│   │   ├── about/
│   │   │   └── index.ts
│   │   └── user/
│   │       └── [id]/
│   │           └── index.ts
│   ├── store/              # State management
│   │   ├── user.ts
│   │   └── theme.ts
│   ├── utils/              # Utility functions
│   ├── main.ts             # Application entry
│   └── style.css           # Global styles
├── tailwind.config.js      # Tailwind configuration
├── index.html
└── package.json
```

## Configure Tailwind CSS

Omitted, refer to Tailwind CSS configuration in Vite projects.

Update `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```