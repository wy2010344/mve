# MVE 框架架构概述

基于你的深入解释，MVE 框架的架构可以分为以下几个核心层次：

## 🏗️ 架构层次

### 1. 核心响应式系统 (wy-helper/signal.ts)

这是 MVE 的心脏，提供了响应式的基础设施：

#### Signal - 响应式状态容器
```typescript
import { createSignal } from "wy-helper";

// Signal 是响应式状态的基础单元
const count = createSignal(0);

// Signal 内部维护：
// - 当前值
// - 观察者列表 (observers)
// - 变更通知机制
```

#### trackSignal - 依赖追踪观察
```typescript
import { trackSignal, hookTrackSignal } from "wy-helper";

// trackSignal 类似 Vue 的 watchEffect，只有 newValue 参数
trackSignal(() => count.get(), (newValue) => {
  console.log(`count 变为 ${newValue}`);
});

// 推荐使用 hookTrackSignal（自动绑定到 stateHolder）
function MyComponent() {
  hookTrackSignal(() => count.get(), (newValue) => {
    console.log(`count 变为 ${newValue}`);
  });
}

// 全局使用
runGlobalHolder(() => {
  hookTrackSignal(() => count.get(), (newValue) => {
    document.title = `Count: ${newValue}`;
  });
});
```

#### memo - 计算优化
```typescript
import { memo } from "wy-helper";

// memo 类似 Vue 的 computed，具有智能优化
// 回调参数：(old, inited) => old: 旧值，inited: 是否不是第一次执行
const memoA = memo((old, inited) => {
  console.log("memoA 计算", { old, inited });
  return count.get() > 0 ? 'positive' : 'negative';
});

const memoB = memo((old, inited) => {
  console.log("memoB 计算", { old, inited });
  return `Result: ${memoA()}`;
});

// 智能优化：即使 count 变化，如果 memoA 返回值相同，memoB 不会重新计算
```

#### addEffect - 批量更新后的回调
```typescript
import { addEffect } from "wy-helper";

// addEffect 类似于 nextTick，支持 level 层级
// level -1, -2: DOM 更新的副作用（框架内部）
// level 0: 默认级别
// level > 0: 用户级别，一般需要大于 -1

addEffect(() => {
  console.log("默认级别 0");
}); // 默认 level 0

addEffect(() => {
  console.log("级别 1 - 在 DOM 更新后");
}, 1);

// 常见模式：在 hookTrackSignal 回调中按需使用
hookTrackSignal(() => signal.get(), (newValue) => {
  addEffect(() => {
    // 执行副作用操作
    updateOtherSignal(newValue);
  }, 1);
});
```

#### batchSignalEnd - 显式批量更新
```typescript
import { batchSignalEnd } from "wy-helper";

// 手动触发批量更新的结束
function updateMultiple() {
  count.set(1);
  name.set("新名称");
  // 通常框架会自动批量处理，但可以显式调用
  batchSignalEnd();
}
```

### 2. 核心渲染系统 (mve-core)

#### stateHolder - 状态生命周期管理
```typescript
// stateHolder 是每个渲染上下文的核心
// 主要功能：
// 1. 销毁回调钩子管理
// 2. Context 上下文管理

import { hookDestroy } from "mve-core";

function MyComponent() {
  // 添加销毁回调
  hookDestroy(() => {
    console.log("组件销毁，清理资源");
    // 清理定时器、事件监听器等
  });
}
```

#### Context 系统
```typescript
import { createContext } from "mve-core";

// Context 基于 stateHolder 实现跨组件通信
const ThemeContext = createContext("light");

function App() {
  ThemeContext.provide("dark");
  // 子组件可以通过 ThemeContext.consume() 获取值
}
```

#### renderForEach - 基础渲染原语

renderForEach 一般不直接调用，通常调用它的封装：

```typescript
// renderArrayKey - 最常用的列表渲染
renderArrayKey(
  () => items.get(),        // 参数1: 获得数组的依赖函数
  (item) => item.id,        // 参数2: 从每个数组元素中取得唯一 key
  (getItem, getIndex, key) => { // 参数3: 渲染回调函数
    // 当数组变化时：
    // - 如果某 item 消失，对应 key 的 stateHolder 销毁
    // - 如果有新增，新建一个 stateHolder
    // - 如果仍然存在，保持 stateHolder
    // - getItem, getIndex 动态获得最新的 item 内容与序号
  }
);

// 其他封装：
// - renderIf: 条件渲染
// - renderOne: 单值渲染
// - renderArray: 简单列表渲染
```

### 3. DOM 桥接层 (mve-dom)

这一层将响应式系统与 DOM 连接起来：

#### 联合类型属性系统
```typescript
// 属性可以是值或返回值的函数
interface DOMProps {
  className?: string | (() => string);
  style?: CSSProperties | (() => CSSProperties);
  onClick?: (e: Event) => void;
  children?: () => void;
}

// 如果是函数，框架会用 trackSignal 观察其中的 Signal
fdom.div({
  className() {
    return isActive.get() ? "active" : "inactive"; // 自动追踪 isActive
  },
  style() {
    return {
      color: theme.get() === "dark" ? "white" : "black" // 自动追踪 theme
    };
  }
});
```

#### 三套 DOM 封装
```typescript
// 1. dom.xx/svg.xx - 链式调用风格
dom.div({
  className: 'container',
  onClick() {
    // 事件处理
  }
}).render(() => {
  dom.p().renderTextContent("内容");
});

// 2. fdom.xx/fsvg.xx - 扁平参数风格 (推荐)
fdom.div({
  className: "container",
  onClick: handler,
  children() {
    fdom.p({
      childrenType: "text",
      children: "内容"
    });
  }
});

// 3. mdom.xx/asvg.xx - 另一种风格
// (具体用法需要查看实现)
```

#### 文本渲染专用函数
```typescript
// 针对 textNode 的专门处理
import { renderText, renderTextContent } from "mve-dom";

// 渲染动态文本
renderText(() => `当前计数: ${count.get()}`);

// 渲染文本内容
renderTextContent(textSignal);
```

### 4. 辅助工具层

#### mve-helper - 核心辅助函数
```typescript
// 基于 mve-core 的外围帮助函数
import { renderArray, renderIf, renderOne, renderArrayKey } from "mve-helper";

// 这些都是基于 renderForEach 的封装
renderArrayKey(
  () => items.get(),
  (item) => item.id,
  (getItem, getIndex, key) => {
    ItemComponent({ item: getItem() });
  }
);

renderIf(
  () => isVisible.get(),
  () => VisibleComponent(),
  () => HiddenComponent()
);
```

#### hookPromiseSignal - 异步状态管理
```typescript
import { hookPromiseSignal } from "mve-helper";

// 当 signalA 或 signalB 变化时，都会触发 fetchRemote 重新执行
const { get, loading, reduceSet } = hookPromiseSignal(() => {
  const a = signalA.get();
  const b = signalB.get();
  
  return () => {
    return fetchRemote(a, b);
  };
});

// get: 远程返回的信号
// loading: 是否正在加载中
// reduceSet: 如果请求成功，可以修改信号的内容
```

#### mve-dom-helper - DOM 辅助函数
```typescript
// 常用的 DOM 操作辅助函数
// 具体功能需要查看实现
```

## 🔄 数据流向

```
Signal 变化 
    ↓
trackSignal 检测到变化
    ↓
触发相关的响应式函数重新执行
    ↓
DOM 属性/内容更新
    ↓
批量更新完成后触发 addEffect
```

## 🎯 核心设计理念

### 1. 细粒度响应式
- 每个 Signal 都有自己的观察者列表
- 只有真正依赖的部分才会更新
- 避免了虚拟 DOM 的全量 diff

### 2. 自动依赖追踪
- 在响应式上下文中调用 `signal.get()` 自动建立依赖
- 无需手动声明依赖关系
- 依赖关系动态变化

### 3. 生命周期管理
- 每个渲染上下文都有自己的 stateHolder
- 通过 hookDestroy 管理资源清理
- 组件销毁时自动清理相关资源

### 4. 批量更新优化
- 多个 Signal 变化会被批量处理
- 减少不必要的重复渲染
- 可以显式控制批量更新时机

## 🚀 实际使用模式

### 基础组件模式
```typescript
function Counter() {
  const count = createSignal(0);
  
  // 清理资源
  hookDestroy(() => {
    console.log("Counter 组件销毁");
  });
  
  fdom.div({
    children() {
      fdom.p({
        childrenType: "text",
        children() {
          return `计数: ${count.get()}`; // 自动追踪
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
}
```

### 状态管理模式
```typescript
// 直接使用 Signal，避免不必要的封装
const appState = createSignal({
  user: null,
  theme: "light",
  loading: false
});

// 计算属性
const isAuthenticated = memo(() => {
  return appState.get().user !== null;
});

// 操作函数
function login(user) {
  appState.set({
    ...appState.get(),
    user
  });
}
```

### 列表渲染模式
```typescript
function TodoList() {
  const todos = createSignal([]);
  
  fdom.ul({
    children() {
      renderArray(() => todos.get(), (todo) => {
        // 每个 todo 项都有自己的 stateHolder
        TodoItem({ todo });
      });
    }
  });
}
```

这个架构设计体现了 MVE 框架的核心优势：
- **简洁性**: 直接使用 Signal，无需复杂的状态管理库
- **高性能**: 细粒度更新，只更新真正变化的部分  
- **类型安全**: 完整的 TypeScript 支持
- **易于理解**: 清晰的数据流和生命周期管理