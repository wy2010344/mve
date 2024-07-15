import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
/**
 https://www.raulmelo.me/en/blog/build-javascript-library-with-multiple-entry-points-using-vite-3#using-vite-32-or-later
 */
export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        index: resolve(__dirname, 'src/index.ts')
      },
      formats: ["es", "cjs"]
    },
    minify: false
  },
  plugins: [dts()]
})