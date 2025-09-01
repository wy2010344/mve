# MVE Framework

一个基于 Signal 模式的现代前端框架，专注于响应式状态管理和细粒度 DOM 更新。

## 特性

- 🚀 **细粒度更新** - 只更新真正变化的 DOM 节点，避免不必要的重渲染
- 🔄 **自动依赖追踪** - Signal 系统自动追踪依赖关系，无需手动管理
- 🎯 **灵活状态流** - 支持双向数据流，无严格的树形结构约束
- 📦 **轻量高效** - 核心库体积小，运行时性能优异
- 🛠️ **TypeScript 支持** - 完整的类型定义，提供优秀的开发体验

## 快速开始

### 安装

```bash
npm install wy-helper wy-dom-helper mve-core mve-helper mve-dom mve-dom-helper
```

### 基础示例

```typescript
import { createRoot } from "mve-dom";
import { fdom } from "mve-dom";
import { createSignal } from "wy-helper";

const app = document.querySelector("#app")!;

createRoot(app, () => {
  const count = createSignal(0);
  
  fdom.div({
    children() {
      fdom.h1({
        childrenType: "text",
        children() {
          return `计数: ${count.get()}`;
        }
      });
      
      fdom.button({
        onClick() {
          count.set(count.get() + 1);
        },
        childrenType: "text",
        children: "增加"
      });
    }
  });
});
```

## 核心概念

### Signal（信号）

Signal 是 MVE 的核心响应式原语：

```typescript
import { createSignal } from "wy-helper";

const message = createSignal("Hello MVE");

// 读取值
console.log(message.get()); // "Hello MVE"

// 设置值
message.set("Hello World");
```

### 响应式渲染

使用函数创建响应式内容：

```typescript
fdom.p({
  childrenType: "text",
  children() {
    // 当 message 变化时，这个函数会自动重新执行
    return `消息: ${message.get()}`;
  }
});
```

### 列表渲染

```typescript
import { renderArray } from "mve-helper";

const items = createSignal(["苹果", "香蕉", "橙子"]);

fdom.ul({
  children() {
    renderArray(items.get, (item, getIndex) => {
      fdom.li({
        childrenType: "text",
        children() {
          return `${getIndex() + 1}. ${item}`;
        }
      });
    });
  }
});
```

## 文档

- [入门指南](./guide/getting-started.md) - 详细的入门教程
- [核心概念](./guide/core-concepts.md) - 深入理解 MVE 的核心概念
- [API 参考](./api/api-reference.md) - 完整的 API 文档

## 示例

查看 [demo](../demo/) 目录获取更多示例代码。

## 与其他框架的对比

| 特性 | React | Vue | SolidJS | MVE |
|------|-------|-----|---------|-----|
| 更新机制 | 虚拟DOM | 响应式 | 细粒度 | 细粒度 |
| 依赖追踪 | 手动 | 自动 | 自动 | 自动 |
| 状态流向 | 单向 | 双向 | 单向 | 双向 |
| 模板语法 | JSX | 模板 | JSX | 函数式 |

## 许可证

MIT