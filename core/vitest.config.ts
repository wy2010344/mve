import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      // 测试直接跑 wy-helper 源码,避免依赖可能过期的 dist 构建产物
      'wy-helper': path.resolve(__dirname, '../../wy-helper/wy-helper/src/index.ts'),
    },
  },
})
