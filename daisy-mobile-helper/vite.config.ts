import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        index: resolve(__dirname, 'src/index.ts')
      },
      formats: ["es", "cjs"]
    },
    minify: false,
    rollupOptions: {
      external: [
        /^wy-helper(\/)?/,
        /^wy-dom-helper(\/)?/,
        "mve-core",
        "mve-helper",
        "mve-dom",
        "mve-dom-helper",
        'history',
        'motion',
        /^mve-icons(\/)?/,
        'tyme4ts'
      ]
    }
  },
  plugins: [
    dts(),
    tailwindcss()
  ]
});