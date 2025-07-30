# 🚀 MVE 框架精炼示例系统

一个精心设计的 MVE 框架学习系统，通过 3 个核心示例，循序渐进地展示框架的完整特性和最佳实践。

## 📋 示例概览

### 🚀 基础入门 (Getting Started)
**学习目标：掌握 MVE 核心概念**

**包含内容：**
- **Signal 响应式**：创建和使用响应式状态
- **memo 计算**：智能缓存和性能优化
- **DOM API 对比**：dom/fdom/adom 三套 API 的使用场景
- **依赖追踪**：hookTrackSignal 监听状态变化

**核心特性：**
- 交互式演示界面
- 实时代码示例
- 性能对比展示
- 分步骤学习导航

### 🎯 实战应用 (Comprehensive Demo)
**学习目标：完整应用开发实践**

**包含内容：**
- **任务管理应用**：完整的 CRUD 操作
- **异步数据处理**：hookPromiseSignal 使用
- **状态管理**：复杂状态的组织和管理
- **Context 系统**：跨组件状态共享

**核心特性：**
- 现代化 UI 设计
- 响应式布局
- 主题切换系统
- 通知系统集成

### ⚡ 高级特性 (Advanced Features)
**学习目标：掌握高级用法和优化技巧**

**包含内容：**
- **Context 系统**：复杂的依赖注入模式
- **性能优化**：memo 缓存策略和渲染优化
- **复杂状态管理**：多层级状态和智能计算
- **通知系统**：全局通知管理和自动清理

**核心特性：**
- 性能监控面板
- 压力测试工具
- 实时指标展示
- 高级状态模式

## 🎯 学习路径

### 推荐学习顺序
1. **🚀 基础入门** → 理解核心概念和 API 差异
2. **🎯 实战应用** → 学习完整应用开发流程
3. **⚡ 高级特性** → 掌握性能优化和高级模式

### 学习重点

#### 基础阶段
- Signal 的创建和使用
- memo 的缓存机制
- 三套 DOM API 的选择
- addEffect 副作用处理

#### 实战阶段
- hookPromiseSignal 异步数据处理
- 状态管理最佳实践
- Context 基于调用栈的正确使用
- 组件生命周期管理

#### 高级阶段
- 性能监控和优化
- 复杂状态管理模式
- 大数据量处理技巧
- 生产级应用架构

## ⚠️ 重要说明

### hookTrackSignal 的正确使用
`hookTrackSignal` 主要用于框架内部的 DOM 属性绑定，在业务代码中应该使用 `addEffect`：

```typescript
// ❌ 错误用法 - 不要在业务代码中直接使用
hookTrackSignal(() => count.get(), (newValue) => {
  console.log('变化:', newValue);
});

// ✅ 正确用法 - 使用 addEffect 处理副作用
addEffect(() => {
  const currentCount = count.get();
  console.log('变化:', currentCount);
});
```

### Context 的正确使用
MVE 的 Context 是基于调用栈的，不是 React 式的 Provider/Consumer 模式：

```typescript
// ❌ 错误用法 - React 式的用法
AppContext.Provider({
  value: contextValue,
  children() { /* ... */ }
});

// ✅ 正确用法 - 基于调用栈
AppContext.provide('valueA');
funA(); // 内部 consume() 得到 'valueA'

AppContext.provide('valueB');  
funB(); // 内部 consume() 得到 'valueB'
```

### hookPromiseSignal 的高效使用
`hookPromiseSignal` 返回的 `get` 函数可以直接用于属性绑定，无需通过 `hookTrackSignal` 同步：

```typescript
// ✅ 推荐用法 - 直接在属性中使用
const {get, loading} = hookPromiseSignal(() => () => fetchData());

fdom.div({
  s_color() {
    const result = get();
    return result?.success ? 'green' : 'red';
  }
});
```

## 🛠️ 技术特性

### Signal 响应式系统
```typescript
// 创建响应式状态
const count = createSignal(0);
const name = createSignal("MVE");

// 原子性更新
count.set(count.get() + 1);

// 副作用处理
addEffect(() => {
  const currentCount = count.get();
  console.log('计数变化:', currentCount);
});
```

### memo 智能缓存
```typescript
// 智能计算属性
const expensiveCalc = memo((old, inited) => {
  console.log('计算执行', { old, inited });
  return heavyCalculation(data.get());
});

// 只在依赖变化时重新计算
const result = expensiveCalc(); // 使用缓存结果
```

### 三套 DOM API
```typescript
// fdom - 扁平参数风格（推荐）
fdom.div({
  className: "container",
  children() {
    fdom.p({ childrenType: "text", children: "Hello" });
  }
});

// dom - 链式调用风格
dom.div({ className: "container" }).render(() => {
  dom.p().renderTextContent("Hello");
});

// adom - 性能优化风格
adom({
  attrs(m) {
    m.className = "container";
    if (isActive.get()) {
      m.s_backgroundColor = "blue";
    }
  }
});
```

### Context 系统
```typescript
// 创建 Context
const AppContext = createContext<{
  theme: () => "light" | "dark";
  toggleTheme: () => void;
}>();

// 提供 Context - 基于调用栈的方式
AppContext.provide(contextValue);
funA(); // 内部使用 AppContext.consume() 获得 contextValue

AppContext.provide(anotherValue);
funB(); // 内部使用 AppContext.consume() 获得 anotherValue

// 消费 Context
function ChildComponent() {
  const context = AppContext.consume();
  const theme = context.theme();
}
```

### hookPromiseSignal 正确用法
```typescript
// hookPromiseSignal 的 get 可直接用于属性绑定
const {get, loading} = hookPromiseSignal(() => {
  return () => fetchData();
});

// 直接在属性中使用，无需通过 hookTrackSignal 同步
fdom.div({
  s_color() {
    const result = get();
    if (result?.type === 'success') {
      return result.value.color;
    }
    return 'gray';
  },
  children() {
    const data = get();
    if (loading.get()) {
      return "加载中...";
    }
    return data ? data.content : "暂无数据";
  }
});
```

## 🎨 设计特色

### 现代化 UI
- **渐变背景**：多层次视觉效果
- **阴影系统**：立体感和层次感
- **动画过渡**：流畅的交互体验
- **响应式设计**：适配各种屏幕尺寸

### 交互优化
- **悬停效果**：丰富的视觉反馈
- **点击动画**：即时响应用户操作
- **状态指示**：清晰的状态变化
- **加载状态**：优雅的异步处理

### 主题系统
- **明暗主题**：支持系统主题切换
- **颜色一致性**：统一的设计语言
- **动态切换**：实时主题变更
- **用户偏好**：记住用户选择

## ⚡ 性能优化

### Signal 优化
- **原子性更新**：避免不必要的重渲染
- **精确依赖**：只追踪真正需要的依赖
- **批量更新**：合并多个状态变更
- **内存管理**：自动清理无用依赖

### memo 缓存策略
- **智能缓存**：基于依赖的缓存机制
- **计算优化**：避免重复的昂贵计算
- **内存效率**：合理的缓存大小控制
- **缓存失效**：精确的失效时机

### 渲染优化
- **按需渲染**：只更新变化的部分
- **虚拟化**：大列表的性能优化
- **懒加载**：按需加载组件和数据
- **代码分割**：减少初始加载时间

## 🔧 开发体验

### 类型安全
- **TypeScript 支持**：完整的类型定义
- **类型推导**：智能的类型推导
- **编译时检查**：提前发现潜在问题
- **IDE 支持**：丰富的开发工具支持

### 调试友好
- **开发模式**：详细的调试信息
- **错误边界**：优雅的错误处理
- **性能监控**：实时性能指标
- **状态追踪**：完整的状态变化日志

### 代码组织
- **模块化设计**：清晰的代码结构
- **组件复用**：高度可复用的组件
- **最佳实践**：遵循框架设计理念
- **文档完善**：详细的代码注释

## 🌟 核心优势

### 学习效率
- **渐进式学习**：从简单到复杂的学习路径
- **实践导向**：通过实际项目学习概念
- **即时反馈**：实时查看代码效果
- **完整示例**：可直接运行的完整代码

### 开发效率
- **简洁 API**：易学易用的 API 设计
- **响应式**：自动的状态同步机制
- **类型安全**：TypeScript 原生支持
- **工具链**：完善的开发工具生态

### 运行性能
- **轻量级**：小巧的运行时体积
- **高性能**：优化的渲染机制
- **内存效率**：合理的内存使用
- **加载速度**：快速的应用启动

## 🚀 快速开始

### 环境要求
- Node.js 16+
- 现代浏览器支持

### 安装和运行
```bash
# 克隆项目
git clone <repository-url>
cd mve-demo

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问
# http://localhost:3000
```

### 项目结构
```
demo/
├── src/
│   └── pages/
│       ├── index.ts              # 主入口和导航
│       ├── getting-started-demo.ts   # 基础入门示例
│       ├── comprehensive-demo.ts     # 实战应用示例
│       └── advanced-features.ts     # 高级特性示例
├── README.md                     # 项目文档
└── package.json                  # 项目配置
```

## 📚 学习资源

### 官方资源
- **框架文档**：[MVE Framework Docs](https://mve-framework.dev)
- **API 参考**：[API Reference](https://mve-framework.dev/api)
- **最佳实践**：[Best Practices Guide](https://mve-framework.dev/best-practices)

### 社区资源
- **GitHub 仓库**：[MVE Framework](https://github.com/mve-framework/mve)
- **问题讨论**：[GitHub Issues](https://github.com/mve-framework/mve/issues)
- **社区讨论**：[GitHub Discussions](https://github.com/mve-framework/mve/discussions)

### 学习建议
1. **动手实践**：跟着示例敲代码，理解每个概念
2. **查看控制台**：观察 memo 计算和依赖追踪的日志
3. **修改参数**：尝试修改示例中的参数，观察效果变化
4. **性能对比**：使用性能工具对比不同实现方式
5. **阅读源码**：深入理解框架的实现原理

## 🤝 贡献指南

欢迎为 MVE 框架示例系统贡献代码和建议！

### 贡献方式
- **报告问题**：发现 bug 或有改进建议
- **提交代码**：修复问题或添加新功能
- **完善文档**：改进文档和示例说明
- **分享经验**：分享使用心得和最佳实践

### 开发规范
- 遵循 TypeScript 最佳实践
- 保持代码简洁和可读性
- 添加必要的注释和文档
- 确保示例的教学价值

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

---

**MVE Framework** - 现代化的响应式 Web 框架 🚀

*让开发更简单，让应用更高效*