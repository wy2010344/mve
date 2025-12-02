import { defineConfig } from 'vite'

export default defineConfig({
  // 添加crypto的polyfill配置
  optimizeDeps: {
    esbuildOptions: {
      // Node.js全局变量配置
      define: {
        global: 'globalThis',
      },
    },
  },
  // 解决crypto模块问题
  resolve: {
    alias: {
      crypto: 'crypto-browserify',
    },
  },
  // 防止vitepress在处理Markdown时尝试使用Node.js特定模块
  ssr: {
    noExternal: ['crypto-browserify'],
  },
})
