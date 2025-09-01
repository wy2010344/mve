# MVE 框架架构图

## 🏗️ 整体架构层次图

```
┌─────────────────────────────────────────────────────────────────┐
│                        MVE 框架架构                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   核心响应式系统 (wy-helper)                     │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   createSignal  │      memo       │   trackSignal   │ addEffect │
│   原子信号      │   智能计算属性   │   依赖追踪      │ 批量回调  │
│   可解包 get/set│   背后依赖 Map  │   只有 newValue │ level层级 │
└─────────────────┴─────────────────┴─────────────────┴───────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   核心渲染系统 (mve-core)                        │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   stateHolder   │     Context     │       renderForEach         │
│   生命周期管理  │   跨组件通信    │      基础渲染原语           │
│  hookDestroy │   传递函数      │   管理子项 stateHolder      │
└─────────────────┴─────────────────┴─────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────────────────┐   ┌─────────────────────────┐
│        辅助工具层 (mve-helper)       │   │   DOM 桥接层 (mve-dom)  │
├─────────┬─────────┬─────────┬──────┤   ├───────┬───────┬─────────┤
│renderIf │renderOne│renderArray│hook │   │dom.xx │fdom.xx│ mdom.xx │
│条件渲染 │单值渲染 │列表渲染  │Promise│   │链式调用│扁平参数│减少依赖│
└─────────┴─────────┴─────────┴──────┘   └───────┴───────┴─────────┘
```

## 🔄 数据流向图

```
Signal 变化
    │
    ▼
trackSignal 检测到变化
    │
    ▼
触发相关的响应式函数重新执行
    │
    ▼
DOM 属性/内容更新 (通过 mve-dom)
    │
    ▼
批量更新完成后触发 addEffect (按 level 层级执行)
```

## 🎯 核心组件关系图

```
createSignal ──────┐
                   │
memo ──────────────┼──► trackSignal ──► hookTrackSignal
                   │         │                │
addEffect ─────────┘         │                │
                             ▼                ▼
                      响应式上下文      stateHolder
                             │                │
                             ▼                ▼
                        DOM 更新        生命周期管理
                             │                │
                             ▼                ▼
                    ┌─────────────────┐  hookDestroy
                    │   三套 DOM API   │
                    ├─────────────────┤
                    │ dom.xx (链式)   │
                    │ fdom.xx (扁平)  │
                    │ mdom.xx (优化)  │
                    └─────────────────┘
```

## 📋 属性转换规则图

```
HTML/CSS 属性                MVE 属性
─────────────────────────────────────────
style.color              →   s_color
style.backgroundColor    →   s_backgroundColor
data-test-id            →   data_testId
data-custom-value       →   data_customValue
--primary-color         →   css_primaryColor
--font-size             →   css_fontSize
aria-label              →   aria_label
aria-expanded           →   aria_expanded
```

## 🔧 Signal 系统详细图

```
createSignal(initialValue)
         │
         ▼
┌─────────────────┐
│   Signal 对象    │
├─────────────────┤
│ • get() 方法    │
│ • set() 方法    │
│ • 观察者列表    │
│ • 变更通知机制  │
└─────────────────┘
         │
         ▼
可以解包使用: const { get, set } = createSignal(0)
         │
         ▼
┌─────────────────┐
│   原子性特点     │
├─────────────────┤
│ • 不是嵌套响应式 │
│ • 对象需整体替换 │
│ • 可手动嵌套优化 │
└─────────────────┘
```

## 🎨 渲染系统层次图

```
renderForEach (基础原语)
         │
         ├─── renderIf (条件渲染)
         │
         ├─── renderOne (单值渲染)
         │
         ├─── renderArray (简单列表)
         │
         └─── renderArrayKey (带键列表) ← 推荐使用
                     │
                     ▼
            每个子项都有独立的 stateHolder
                     │
                     ▼
            ┌─────────────────────────┐
            │   stateHolder 管理      │
            ├─────────────────────────┤
            │ • 项目消失 → 销毁       │
            │ • 项目新增 → 创建       │
            │ • 项目存在 → 保持       │
            │ • getItem/getIndex 动态 │
            └─────────────────────────┘
```

## 🔄 memo 智能优化图

```
Signal A 变化
    │
    ▼
memo A 重新计算
    │
    ├─── 返回值相同 ──► memo B 不执行 (智能优化)
    │
    └─── 返回值不同 ──► memo B 重新执行
                           │
                           ▼
                      依赖 memo B 的其他计算
```

## 🎯 addEffect 层级系统图

```
addEffect 执行顺序 (按 level 从小到大)

level -2  ┌─────────────────┐
level -1  │  框架内部使用    │ ← DOM 更新的副作用
          │  (用户不应使用)  │
          └─────────────────┘
level 0   ┌─────────────────┐
          │   默认用户级别   │ ← 默认 level
          └─────────────────┘
level 1   ┌─────────────────┐
level 2   │   用户自定义     │ ← 一般需要 > -1
level 3   │     级别        │
...       └─────────────────┘

常见使用模式:
hookTrackSignal(() => signal.get(), (newValue) => {
  addEffect(() => {
    // 副作用操作
  }, 1); // level 1，确保在 DOM 更新后执行
});
```

## 🌐 Context 传递模式图

```
❌ 错误模式:
ThemeContext.provide(theme.get()) ──► 传递值
                │
                ▼
        const theme = ThemeContext.consume() ──► 获取静态值

✅ 正确模式:
ThemeContext.provide(() => theme.get()) ──► 传递 getter 函数
                │
                ▼
        const getTheme = ThemeContext.consume() ──► 获取 getter 函数
                │
                ▼
        getTheme() ──► 每次获取最新值
```

## 🎨 三套 DOM API 对比图

```
┌─────────────────┬─────────────────┬─────────────────┐
│    dom.xx       │    fdom.xx      │    mdom.xx      │
│   (链式调用)     │   (扁平参数)     │   (减少依赖)     │
├─────────────────┼─────────────────┼─────────────────┤
│ dom.div({       │ fdom.div({      │ mdom({          │
│   className:'x' │   className:'x',│   attrs(m) {    │
│ }).render(() => │   s_color:'red',│     if(active){ │
│   dom.p()       │   children() {  │       m.s_color │
│     .renderText │     fdom.p({    │       m.s_bg    │
│     Content('') │       children  │     }           │
│ });             │       Type:'text│     m.className │
│                 │       children: │   },            │
│                 │       'content' │   children() {  │
│                 │     });         │     // 同 fdom  │
│                 │   }             │   }             │
│                 │ });             │ });             │
├─────────────────┼─────────────────┼─────────────────┤
│ 符合 DOM 结构   │ 推荐使用        │ 性能优化        │
│ 链式调用风格    │ 扁平参数风格    │ 减少 trackSignal│
└─────────────────┴─────────────────┴─────────────────┘
```

## 🚀 完整使用流程图

```
1. 创建状态
   createSignal(initialValue)
            │
            ▼
2. 创建计算属性 (可选)
   memo((old, inited) => calculate())
            │
            ▼
3. 设置依赖追踪
   hookTrackSignal(() => signal.get(), (newValue) => {
     addEffect(() => {
       // 副作用
     }, level);
   });
            │
            ▼
4. 渲染 DOM
   fdom.div({
     s_color() { return signal.get() },
     children() {
       renderArrayKey(
         () => items.get(),
         item => item.id,
         (getItem) => ItemComponent({ item: getItem() })
       );
     }
   });
            │
            ▼
5. 生命周期管理
   hookDestroy(() => {
     // 清理资源
   });
```

这个架构图展示了 MVE 框架的完整结构和各组件之间的关系。核心思想是基于 Signal 的细粒度响应式更新，通过 trackSignal 自动建立依赖关系，最终通过三套 DOM API 将变化反映到界面上。

## 🔍 h

ookPromiseSignal 异步处理图

```
依赖信号变化
    │
    ▼
┌─────────────────────────────────────┐
│        hookPromiseSignal            │
├─────────────────────────────────────┤
│ const { get, loading, reduceSet }   │
│   = hookPromiseSignal(() => {       │
│     const a = signalA.get();        │
│     const b = signalB.get();        │
│     return () => fetchRemote(a, b); │
│   });                               │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      get        │    │    loading      │    │   reduceSet     │
│   远程返回的     │    │  是否正在加载   │    │ 修改信号内容    │
│     信号        │    │      中         │    │   (成功时)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎭 children() 回调使用规则图

```
❌ 错误用法:
fdom.li({
  children() {
    const todo = getItem(); ← 错误：在 children 回调中获取
    fdom.span({
      childrenType: "text",
      children: todo.text  ← 错误：静态内容
    });
  }
});

✅ 正确用法:
fdom.li({
  children() {
    fdom.span({
      childrenType: "text",
      children() {          ← 正确：在最终观察属性节点上
        const todo = getItem();
        return todo.text;   ← 正确：动态内容
      }
    });
  }
});

规则总结:
┌─────────────────────────────────────────┐
│ children() 回调中一般不获得信号内容      │
│ 信号内容需要在最终观察属性节点上展开    │
└─────────────────────────────────────────┘
```

## 🎯 childrenType 使用图

```
childrenType 的三种模式:

1. 默认模式 (渲染子组件)
   fdom.div({
     children() {
       ChildComponent();  ← 渲染子组件
       fdom.span({...});  ← 渲染其他元素
     }
   });

2. "text" 模式 (渲染文本)
   fdom.div({
     childrenType: "text",
     children() {
       return `计数: ${count.get()}`; ← 返回文本字符串
     }
   });

3. "html" 模式 (渲染 HTML)
   fdom.div({
     childrenType: "html",
     children() {
       return `<svg>${svgStr.get()}</svg>`; ← 返回 HTML 字符串
     }
   });
```

## 🔄 Signal 嵌套优化策略图

```
场景1: 简单对象 (推荐整体替换)
const user = createSignal({ name: "张三", age: 25 });
user.set({ ...user.get(), age: 26 }); ← 整体替换

场景2: 复杂对象 (推荐手动嵌套)
const userState = createSignal({
  name: createSignal("张三"),
  age: createSignal(25),
  profile: createSignal({
    email: createSignal("zhangsan@example.com"),
    phone: createSignal("13800138000")
  })
});

更新策略:
userState.get().age.set(26);                           ← 单独更新年龄
userState.get().profile.get().email.set("new@email"); ← 单独更新邮箱

优势对比:
┌─────────────────┬─────────────────┬─────────────────┐
│    更新方式     │    性能影响     │    使用场景     │
├─────────────────┼─────────────────┼─────────────────┤
│    整体替换     │  重新创建对象   │   简单对象      │
│    手动嵌套     │  只更新变化部分 │   复杂对象      │
└─────────────────┴─────────────────┴─────────────────┘
```

## 🎨 实际项目使用模式图

```
典型的 MVE 应用结构:

┌─────────────────────────────────────────────────────────────┐
│                        App 组件                              │
├─────────────────────────────────────────────────────────────┤
│ // 全局状态                                                 │
│ const appState = createSignal({                             │
│   user: null,                                               │
│   theme: "light",                                           │
│   loading: false                                            │
│ });                                                         │
│                                                             │
│ // 全局计算属性                                             │
│ const isAuthenticated = memo(() => {                        │
│   return appState.get().user !== null;                     │
│ });                                                         │
│                                                             │
│ // 全局状态操作                                             │
│ function login(user) {                                      │
│   appState.set({ ...appState.get(), user });               │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Context 提供                           │
├─────────────────────────────────────────────────────────────┤
│ const AppContext = createContext({                          │
│   getUser: () => appState.get().user,                      │
│   getTheme: () => appState.get().theme,                    │
│   login,                                                    │
│   logout                                                    │
│ });                                                         │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      子组件消费                             │
├─────────────────────────────────────────────────────────────┤
│ function Header() {                                         │
│   const { getUser, getTheme } = AppContext.consume();      │
│                                                             │
│   fdom.header({                                             │
│     s_backgroundColor() {                                   │
│       return getTheme() === "dark" ? "#333" : "#fff";      │
│     },                                                      │
│     children() {                                            │
│       const user = getUser();                              │
│       if (user) {                                           │
│         UserProfile({ user });                             │
│       } else {                                              │
│         LoginButton();                                      │
│       }                                                     │
│     }                                                       │
│   });                                                       │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 性能优化决策树

```
需要计算属性吗?
        │
        ├─ 简单计算 (如 a * 2) ──► 直接计算，不使用 memo
        │
        └─ 复杂计算 ──► 使用 memo
                        │
                        ├─ 计算频繁 ──► 一定使用 memo
                        │
                        └─ 计算不频繁 ──► 考虑 memo 的 Map 开销

需要列表渲染吗?
        │
        ├─ 简单列表 ──► renderArray
        │
        └─ 复杂列表 ──► renderArrayKey (提供稳定 key)
                        │
                        ├─ 列表项会频繁变化 ──► 必须用 renderArrayKey
                        │
                        └─ 列表项相对稳定 ──► 可以用 renderArray

需要跨组件通信吗?
        │
        ├─ 父子组件 ──► 直接传递 props
        │
        └─ 跨层级组件 ──► 使用 Context
                          │
                          ├─ 传递静态值 ──► 直接传递
                          │
                          └─ 传递动态值 ──► 传递 getter 函数
```

## 🎯 错误排查流程图

```
遇到问题时的排查步骤:

1. Signal 不更新?
   ├─ 检查是否直接修改对象属性 ──► 改为整体替换
   ├─ 检查是否在正确的响应式上下文中 ──► 使用 trackSignal
   └─ 检查 memo 是否返回相同值 ──► 确认返回值确实变化

2. DOM 不更新?
   ├─ 检查是否在 children() 回调中获取信号 ──► 移到最终节点
   ├─ 检查属性名是否正确 ──► 使用 s_ 前缀
   └─ 检查是否使用了静态值 ──► 改为函数形式

3. 性能问题?
   ├─ 检查是否过度使用 memo ──► 简单计算直接执行
   ├─ 检查列表渲染是否有稳定 key ──► 使用 renderArrayKey
   └─ 检查是否有不必要的重复计算 ──► 使用 memo 缓存

4. 内存泄漏?
   ├─ 检查是否正确清理资源 ──► 使用 hookDestroy
   ├─ 检查是否有循环引用 ──► 检查 Signal 依赖关系
   └─ 检查异步操作是否正确处理 ──► 使用 hookIsDestroyed
```

## 📚 学习路径建议图

```
MVE 学习路径:

初学者路径:
入门指南 ──► 核心概念 ──► 最佳实践 ──► 实践项目
    │           │           │           │
    ▼           ▼           ▼           ▼
基础概念    Signal系统   避免错误    构建应用
环境搭建    DOM操作     性能优化    解决问题

Vue/React 迁移路径:
迁移指南 ──► API对比表 ──► 核心概念 ──► TDesign迁移
    │           │           │           │
    ▼           ▼           ▼           ▼
概念对比    快速查找    深入理解    项目实战
模式转换    API映射     最佳实践    组件迁移

深入理解路径:
架构概述 ──► 核心概念 ──► 最佳实践 ──► 源码阅读
    │           │           │           │
    ▼           ▼           ▼           ▼
整体架构    详细机制    实战经验    底层原理
设计思想    使用方法    性能优化    扩展开发
```

## 🎉 总结

这个架构图展示了 MVE 框架的完整生态系统：

### 核心优势

- **原子信号**: 简单直接的状态管理
- **智能优化**: memo 的返回值比较机制
- **自动追踪**: trackSignal 的依赖收集
- **细粒度更新**: 只更新真正变化的部分
- **生命周期管理**: 自动资源清理

### 设计理念

- **函数式**: 传递函数而不是值
- **声明式**: 描述状态和关系，框架处理更新
- **性能优先**: 减少不必要的计算和更新
- **类型安全**: 完整的 TypeScript 支持

### 适用场景

- 需要细粒度状态管理的应用
- 从 Vue/React 迁移的项目
- 对性能有较高要求的应用
- 需要简洁 API 的中小型项目

MVE 框架通过这种分层架构，提供了一个既简单又强大的响应式开发体验。
