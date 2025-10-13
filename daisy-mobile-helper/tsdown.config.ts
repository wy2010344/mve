import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['./src/index.ts'],
  platform: 'neutral',
  dts: true,
  external: [
    /^wy-helper(\/)?/,
    /^wy-dom-helper(\/)?/,
    'mve-core',
    /^mve-helper(\/)?/,
    'mve-dom',
    /^mve-dom-helper(\/)?/,
    'history', // 保持 history 为外部依赖
    'motion',
    /^mve-icons(\/)?/,
    'tyme4ts',
  ],
  format: ['esm', 'cjs'],
});
