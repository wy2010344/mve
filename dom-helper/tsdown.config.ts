import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
    canvasRender: './src/canvasRender/index.ts',
    history: './src/history/index.ts',
  },
  platform: 'neutral',
  dts: true,
  external: [
    /^wy-helper(\/)?/,
    /^wy-dom-helper(\/)?/,
    'mve-core',
    'mve-helper',
    'mve-dom',
    'history',
  ],
  format: ['esm', 'cjs'],
})
