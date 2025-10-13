import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  format: ['cjs', 'esm'],
  dts: true,
  external: [
    /^wy-helper(\/)?/,
    /^wy-dom-helper(\/)?/,
    'mve-core',
    'mve-helper',
  ],
});
