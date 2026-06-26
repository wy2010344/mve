import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  base: '/mve/',
  title: 'MVE',
  lang: 'zh-CN',
  description: 'MVE, 信号驱动的前端框架',
  icon: '/rspress-icon.png',
  logo: {
    light: '/rspress-light-logo.png',
    dark: '/rspress-dark-logo.png',
  },
  locales: [
    {
      lang: 'zh-CN',
      label: '中文',
    },
    {
      lang: 'en',
      label: 'English',
      description: 'MVE, a signal-driven front-end framework',
    },
  ],
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/wy2010344/mve',
      },
    ],
    locales: [
      {
        lang: 'zh-CN',
        label: '中文',
        nav: [
          { text: '首页', link: '/' },
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
              { text: '中文', link: '/' },
              { text: 'English', link: '/en/' },
            ],
          },
        ],
        sidebar: {
          '/': [
            {
              text: '🚀 入门指南',
              items: [
                { text: '快速开始', link: '/guide/getting-started' },
                { text: '架构概览', link: '/guide/architecture-overview' },
                { text: 'API 对比表', link: '/guide/api-comparison-table' },
              ],
            },
            {
              text: '🔍 核心概念',
              collapsed: false,
              items: [
                { text: '⚛️ 响应式系统', link: '/core/' },
                { text: '🏗️ Context 系统', link: '/core/context' },
                { text: '🔧 生命周期管理', link: '/core/lifecycle' },
                { text: '🎨 渲染系统', link: '/core/dynamic' },
                { text: '🌐 三套 DOM API', link: '/core/dom' },
              ],
            },
            {
              text: '📚 功能模块',
              collapsed: false,
              items: [
                { text: '🔄 常用异步信号', link: '/promise-signal' },
                { text: '🧭 路由', link: '/router' },
                {
                  text: '✨ 动画',
                  link: '/animation/',
                  items: [
                    { text: 'CSS 过渡动画', link: '/animation/css-transition' },
                    { text: '视图切换动画', link: '/animation/exit-animation' },
                  ],
                },
                { text: '🎨 Canvas', link: '/canvas' },
              ],
            },
            {
              text: '💡 开发者资源',
              collapsed: true,
              items: [
                { text: '最佳实践与常见错误', link: '/best-practices' },
              ],
            },
          ],
        },
      },
      {
        lang: 'en',
        label: 'English',
        nav: [
          { text: 'Home', link: '/en/' },
          {
            text: 'Guide',
            items: [
              { text: 'Quick Start', link: '/en/guide/getting-started' },
              { text: 'Architecture Overview', link: '/en/guide/architecture-overview' },
              { text: 'API Comparison Table', link: '/en/guide/api-comparison-table' },
            ],
          },
          {
            text: 'Core',
            items: [
              { text: 'Reactive System', link: '/en/core/' },
              { text: 'Context', link: '/en/core/context' },
              { text: 'DOM API', link: '/en/core/dom' },
              { text: 'Lifecycle', link: '/en/core/lifecycle' },
              { text: 'Rendering', link: '/en/core/dynamic' },
            ],
          },
          {
            text: 'Advanced',
            items: [
              { text: 'Animation', link: '/en/animation/' },
              { text: 'Router', link: '/en/router' },
              { text: 'Canvas', link: '/en/canvas' },
              { text: 'Best Practices', link: '/en/best-practices' },
            ],
          },
          {
            text: 'Language',
            items: [
              { text: '中文', link: '/' },
              { text: 'English', link: '/en/' },
            ],
          },
        ],
        sidebar: {
          '/en/': [
            {
              text: 'Getting Started',
              items: [
                { text: 'Quick Start', link: '/en/guide/getting-started' },
                { text: 'Architecture Overview', link: '/en/guide/architecture-overview' },
                { text: 'API Comparison Table', link: '/en/guide/api-comparison-table' },
              ],
            },
            {
              text: 'Core Concepts',
              collapsed: false,
              items: [
                { text: 'Reactive System', link: '/en/core/' },
                { text: 'Context', link: '/en/core/context' },
                { text: 'Lifecycle', link: '/en/core/lifecycle' },
                { text: 'Rendering', link: '/en/core/dynamic' },
                { text: 'DOM APIs', link: '/en/core/dom' },
              ],
            },
            {
              text: 'Modules',
              collapsed: false,
              items: [
                { text: 'Async Signals', link: '/en/promise-signal' },
                { text: 'Router', link: '/en/router' },
                {
                  text: 'Animation',
                  link: '/en/animation/',
                  items: [
                    { text: 'CSS Transition', link: '/en/animation/css-transition' },
                    { text: 'Exit Animation', link: '/en/animation/exit-animation' },
                  ],
                },
                { text: 'Canvas', link: '/en/canvas' },
              ],
            },
            {
              text: 'Resources',
              collapsed: true,
              items: [
                { text: 'Best Practices', link: '/en/best-practices' },
              ],
            },
          ],
        },
      },
    ],
  },
});
