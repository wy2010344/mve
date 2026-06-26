# 入门指南

本指南基于实际 MVE 项目的开发模式，帮助你快速上手并构建真实的应用。

## 环境准备

### 系统要求

- Node.js 16+
- 现代浏览器（支持 ES2020）
- TypeScript 4.5+（推荐）

### 创建新项目

使用 Vite 创建项目（推荐，与实际项目一致）：

```bash
npm create vite@latest my-mve-app -- --template vanilla-ts
cd my-mve-app
npm install
```

### 安装 MVE 核心依赖

```bash
npm install wy-helper wy-dom-helper mve-core mve-helper mve-dom mve-dom-helper
```

### 安装推荐的样式方案

基于实际项目经验，推荐使用 Tailwind CSS + DaisyUI：

```bash
# 样式框架（实际项目标配）
npm install tailwindcss daisyui @tailwindcss/vite

# 移动端开发辅助库（实际项目常用）
npm install daisy-mobile-helper

# 图标库（实际项目必备）
npm install mve-icons

# 路由和历史管理（实际项目需要）
npm install history
```

## 项目结构

基于实际 MVE 项目的推荐结构：

```
my-mve-app/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── form-card.ts
│   │   ├── dialog.ts
│   │   └── layout.ts
│   ├── pages/              # 页面组件（基于文件路由）
│   │   ├── home/
│   │   │   ├── index.ts    # 首页
│   │   │   └── layout.ts   # 首页布局
│   │   ├── about/
│   │   │   └── index.ts
│   │   └── user/
│   │       └── [id]/
│   │           └── index.ts
│   ├── store/              # 状态管理
│   │   ├── user.ts
│   │   └── theme.ts
│   ├── utils/              # 工具函数
│   ├── main.ts             # 应用入口
│   └── style.css           # 全局样式
├── tailwind.config.js      # Tailwind 配置
├── index.html
└── package.json
```

## 配置 Tailwind CSS

安装 Tailwind CSS Vite 插件后，在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [tailwindcss()],
});
```

然后创建 `src/style.css` 引入 Tailwind：

```css
@import "tailwindcss";
@plugin "daisyui";
```

在 `main.ts` 中导入样式：

```typescript
import './style.css'
```

> 如需自定义 Tailwind 配置，参见 [Tailwind CSS 官方文档](https://tailwindcss.com/docs)。DaisyUI 的组件用法参见 [DaisyUI 文档](https://daisyui.com/docs/)。
