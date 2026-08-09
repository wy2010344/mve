import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  dts: true,
  deps: {
    neverBundle: [/^wy-helper(\/)?/, /^three(\/)?/, 'mve-core', 'mve-helper'],
  },
  format: ['esm', 'cjs'],
});
