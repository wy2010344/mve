import { defineConfig } from 'vitepress'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'mve',
  description: 'mve, a signal-driven front-end framework',
  outDir: '../docs',
  base: '/mve/',
  // markdown: {
  //   config: (md) => {
  //     configureDiagramsPlugin(md, {
  //       diagramsDir: 'diagrams', // 可选：自定义 SVG 文件目录
  //       publicPath: 'diagrams', // 可选：自定义公共路径
  //     })
  //   },
  // },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
    ],

    sidebar: [
      // {
      //   text: 'Examples',
      //   items: [
      //     { text: 'Markdown Examples', link: '/markdown-examples' },
      //     { text: 'Runtime API Examples', link: '/api-examples' },
      //   ],
      // },
      {
        text: 'mve 核心概念',
        link: '/core/',
        items: [
          {
            text: '🏗️ Context 系统',
            link: '/core/context',
          },
          {
            text: ' 🔧 生命周期管理',
            link: '/core/lifecycle',
          },
          {
            text: '🎨 渲染系统',
            link: '/core/dynamic',
          },
          {
            text: '🌐 三套 DOM API',
            link: '/core/dom',
          },
        ],
      },
      {
        text: '🔄 常用异步信号',
        link: '/promise-signal',
      },
      {
        text: '路由',
        link: '/router',
      },
      {
        text: '动画',
        link: '/animation/',
        items: [
          {
            text: 'CSS 过渡动画',
            link: '/animation/css-transition',
          },
          {
            text: '视图切换动画',
            link: '/animation/exit-animation',
          },
        ],
      },
      {
        text: '布局',
        link: '/layout',
      },
      {
        text: 'canvas',
        link: '/canvas',
      },
      {
        text: '最佳实践与常见错误',
        link: '/best-practices',
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/wy2010344/mve' }],
  },
})
