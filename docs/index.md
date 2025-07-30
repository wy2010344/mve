# MVE 框架文档

欢迎来到 MVE 框架文档！这里包含了学习和使用 MVE 框架所需的所有信息。

## 📚 文档导航

### 🚀 快速开始

1. **[入门指南](./guide/getting-started.md)** - 环境准备和第一个应用
2. **[从 Vue/React 迁移](./guide/migration-from-vue-react.md)** 🔥 - 迁移指南和对比
3. **[API 对比表](./guide/api-comparison-table.md)** 📋 - 快速查找对应 API

### 📖 核心文档

4. **[架构概述](./guide/architecture-overview.md)** - 整体架构理解
5. **[核心概念](./guide/core-concepts.md)** - 详细概念说明
6. **[最佳实践](./guide/best-practices.md)** ⚠️ - 最佳实践与常见错误

### 📋 快速参考

8. **[框架总结](./SUMMARY.md)** - 核心特性和要点总结
9. **[架构图表](./MVE-ARCHITECTURE-DIAGRAM.md)** 📊 - 可视化架构关系图

## 🎯 学习路径

### 新手入门

```
入门指南 → 核心概念 → 常见错误 → 实践项目
```

### Vue/React 迁移

```
迁移指南 → API 对比表 → 核心概念 → TDesign 迁移（如需要）
```

### 深入理解

```
架构概述 → 核心概念 → 最佳实践 → 高级应用
```

## 💡 核心特性

- **原子信号**: createSignal 创建原子响应式状态
- **智能计算**: memo 减少重复计算，支持返回值优化
- **依赖追踪**: trackSignal/hookTrackSignal 自动依赖收集
- **三套 DOM API**: dom/fdom/mdom 适应不同使用场景
- **异步处理**: hookPromiseSignal 处理依赖变化的异步请求

## 🔧 属性转换规则

MVE 的属性转换规则：

- `style.xxx` → `s_xxx`
- `data-attrXXX` → `data_attrXXX`
- `--varcssxx` → `css_varcssxx`
- `aria-xxx` → `aria_xxx`

## 📝 示例代码

所有文档中的示例代码都可以在 [demo 目录](../demo/) 中找到完整的可运行示例。

---

MVE 框架的设计理念是简洁直接，基于 Signal 的细粒度响应式更新，为开发者提供高效的开发体验。
