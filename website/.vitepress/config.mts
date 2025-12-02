import { defineConfig } from 'vitepress'
// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'MVE',
  description: 'MVE, a signal-driven front-end framework',
  outDir: '../docs',
  base: '/mve/',
  // 使用vitepress内置的搜索功能，无需额外插件
  // 启用国际化
  locales: {
    // 中文（默认语言）
    root: {
      label: '中文',
      lang: 'zh-CN',
      description: 'MVE, 信号驱动的前端框架',
    },
    // 英文
    en: {
      label: 'English',
      lang: 'en-US',
      description: 'MVE, a signal-driven front-end framework',
      link: '/en/', // 英文文档的链接前缀
    },
  },
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
    // 使用vitepress内置搜索功能
    search: {
      provider: 'local',
      options: {
        // 搜索结果的最大数量
        // maxResults: 10,
        // 搜索的最小字符数
        // minSearchLength: 2,
        // 多语言配置
        locales: {
          root: {
            translations: {
              button: {
                buttonText: '搜索',
                buttonAriaLabel: '搜索',
              },
            },
          },
          en: {
            translations: {
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search',
              },
            },
          },
        },
      },
    },
    // 优化顶部导航栏结构
    nav: [
      {
        text: '首页',
        link: '/',
        activeMatch: '^/$',
      },
      {
        text: '指南',
        items: [
          { text: '快速开始', link: '/guide/getting-started' },
          { text: '架构概览', link: '/guide/architecture-overview' },
          { text: 'API 对比表', link: '/guide/api-comparison-table' },
        ],
      },
      {
        text: '核心',
        items: [
          { text: '响应式系统', link: '/core/' },
          { text: 'Context 系统', link: '/core/context' },
          { text: 'DOM API', link: '/core/dom' },
        ],
      },
      {
        text: '进阶',
        items: [
          { text: '动画', link: '/animation/' },
          { text: '路由', link: '/router' },
          { text: 'Canvas', link: '/canvas' },
          { text: '最佳实践', link: '/best-practices' },
        ],
      },
      {
        text: '语言',
        items: [
          { text: '中文', link: '/', activeMatch: '^/$' },
          { text: 'English', link: '/en/', activeMatch: '^/en/' },
        ],
      },
    ],

    // 优化侧边栏结构，增强层次感和可访问性
    sidebar: {
      // 默认侧边栏（中文）
      '/': [
        {
          text: '🚀 入门指南',
          items: [
            {
              text: '快速开始',
              link: '/guide/getting-started',
            },
            {
              text: '架构概览',
              link: '/guide/architecture-overview',
            },
            {
              text: 'API 对比表',
              link: '/guide/api-comparison-table',
            },
          ],
        },
        {
          text: '🔍 核心概念',
          //
          collapsed: false,
          items: [
            {
              text: '🏗️ Context 系统',
              link: '/core/context',
            },
            {
              text: '🔧 生命周期管理',
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
          text: '📚 功能模块',
          //
          collapsed: false,
          items: [
            {
              text: '🔄 常用异步信号',
              link: '/promise-signal',
            },
            {
              text: '🧭 路由',
              link: '/router',
            },
            {
              text: '✨ 动画',
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
              text: '🎨 Canvas',
              link: '/canvas',
            },
          ],
        },
        {
          text: '💡 开发者资源',
          //
          collapsed: true,
          items: [
            {
              text: '最佳实践与常见错误',
              link: '/best-practices',
            },
          ],
        },
      ],
      // 英文侧边栏
      '/en/': [
        {
          text: '🚀 Getting Started',
          items: [
            {
              text: 'Quick Start',
              link: '/en/guide/getting-started',
            },
            {
              text: 'Architecture Overview',
              link: '/en/guide/architecture-overview',
            },
            {
              text: 'API Comparison Table',
              link: '/en/guide/api-comparison-table',
            },
          ],
        },
        {
          text: '🔍 Core Concepts',

          collapsed: false,
          items: [
            {
              text: '🏗️ Context System',
              link: '/en/core/context',
            },
            {
              text: '🔧 Lifecycle Management',
              link: '/en/core/lifecycle',
            },
            {
              text: '🎨 Rendering System',
              link: '/en/core/dynamic',
            },
            {
              text: '🌐 Three DOM APIs',
              link: '/en/core/dom',
            },
          ],
        },
        {
          text: '📚 Feature Modules',

          collapsed: false,
          items: [
            {
              text: '🔄 Async Signals',
              link: '/en/promise-signal',
            },
            {
              text: '🧭 Router',
              link: '/en/router',
            },
            {
              text: '✨ Animation',
              link: '/en/animation/',

              items: [
                {
                  text: 'CSS Transitions',
                  link: '/en/animation/css-transition',
                },
                {
                  text: 'View Transition Animation',
                  link: '/en/animation/exit-animation',
                },
              ],
            },
            {
              text: '📐 Layout',
              link: '/en/layout',
            },
            {
              text: '🎨 Canvas',
              link: '/en/canvas',
            },
          ],
        },
        {
          text: '💡 Developer Resources',

          collapsed: true,
          items: [
            {
              text: 'Best Practices & Common Errors',
              link: '/en/best-practices',
            },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/wy2010344/mve' }],

    // 添加页面底部信息
    footer: {
      message: '基于 MVE 框架构建',
      copyright: `© ${new Date().getFullYear()} MVE Framework. 保留所有权利。`,
    },
  },
})
