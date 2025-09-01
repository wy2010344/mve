# MVE 架构与知识图表

## 整体架构图

```mermaid
graph TB
    subgraph "MVE 生态系统"
        subgraph "核心层 (Core)"
            A[mve-core<br/>响应式系统]
            B[wy-helper<br/>工具函数]
        end

        subgraph "DOM 层"
            C[mve-dom<br/>DOM 操作]
            D[mve-dom-helper<br/>DOM 辅助]
        end

        subgraph "功能层"
            E[mve-helper<br/>组件辅助]
            F[daisy-mobile-helper<br/>移动端组件]
        end

        subgraph "应用层"
            G[路由系统<br/>createTreeRoute]
            H[动画系统<br/>getExitAnimateArray]
            I[状态管理<br/>Signal/Context]
        end
    end

    A --> C
    B --> A
    C --> D
    A --> E
    E --> F
    D --> G
    E --> H
    A --> I

    style A fill:#ff6b6b
    style C fill:#4ecdc4
    style E fill:#45b7d1
    style G fill:#96ceb4
```

## 响应式系统架构

```d2
direction: right

core: {
  label: "MVE Core 响应式系统"

  signal: {
    label: "Signal"
    shape: cylinder
    style.fill: "#ff6b6b"
  }

  context: {
    label: "Context"
    shape: cylinder
    style.fill: "#4ecdc4"
  }

  effect: {
    label: "Effect"
    shape: cylinder
    style.fill: "#45b7d1"
  }

  hooks: {
    label: "Hooks"
    shape: rectangle
    style.fill: "#96ceb4"
  }
}

dom: {
  label: "DOM 层"

  fdom: {
    label: "fdom"
    shape: rectangle
    style.fill: "#feca57"
  }

  render: {
    label: "Render Functions"
    shape: rectangle
    style.fill: "#ff9ff3"
  }
}

app: {
  label: "应用层"

  components: {
    label: "Components"
    shape: rectangle
    style.fill: "#54a0ff"
  }

  pages: {
    label: "Pages"
    shape: rectangle
    style.fill: "#5f27cd"
  }
}

core.signal -> dom.fdom: "数据绑定"
core.context -> dom.fdom: "上下文传递"
core.effect -> dom.render: "副作用处理"
core.hooks -> app.components: "生命周期"
dom.fdom -> app.components: "DOM 创建"
dom.render -> app.pages: "页面渲染"
```

## 组件生命周期

```mermaid
sequenceDiagram
    participant App as 应用
    participant Component as 组件
    participant Signal as Signal
    participant DOM as DOM
    participant Effect as Effect

    App->>Component: 创建组件
    Component->>Signal: 创建响应式数据
    Component->>DOM: 创建 DOM 元素
    Component->>Effect: 注册副作用

    loop 响应式更新
        Signal->>Effect: 数据变化
        Effect->>DOM: 更新 DOM
        DOM->>App: 重新渲染
    end

    App->>Component: 销毁组件
    Component->>Effect: 清理副作用
    Component->>DOM: 移除 DOM
    Component->>Signal: 清理数据
```

## 路由系统流程

```mermaid
flowchart TD
    A[URL 变化] --> B{解析路径}
    B --> C[匹配路由树]
    C --> D{路由类型}

    D -->|Branch| E[加载布局组件]
    D -->|Leaf| F[加载页面组件]
    D -->|NotFound| G[显示 404]

    E --> H[渲染子路由]
    F --> I[渲染页面内容]
    G --> J[渲染错误页面]

    H --> K[页面切换动画]
    I --> K
    J --> K

    K --> L[完成渲染]

    style A fill:#ff6b6b
    style D fill:#4ecdc4
    style K fill:#45b7d1
    style L fill:#96ceb4
```

## 动画系统架构

```plantuml
@startuml
!theme plain

package "动画系统" {
  class ExitAnimateArray {
    +getKey()
    +mode: "pop" | "shift"
    +wait: "normal" | "in-out" | "out-in"
    +enterIgnore()
    +exitIgnore()
  }

  class ExitModel {
    +value: GetValue<T>
    +key: K
    +step: "enter" | "exiting" | "will-exiting"
    +resolve()
    +promise()
  }

  class TransitionController {
    +className(prefix: string)
    +didShow(): boolean | "active"
    +set: Set<Element>
  }

  class LayoutPageRenderer {
    +renderLayoutPage()
    +getDirection()
    +animationConfig
  }
}

package "CSS 动画" {
  class HookTransition {
    +show: GetValue<boolean>
    +beginChange()
  }

  class AnimationClasses {
    +enter-active
    +enter-from
    +enter-to
    +leave-active
    +leave-from
    +leave-to
  }
}

ExitAnimateArray --> ExitModel : creates
ExitModel --> TransitionController : controls
HookTransition --> TransitionController : manages
LayoutPageRenderer --> ExitAnimateArray : uses
TransitionController --> AnimationClasses : generates

@enduml
```

## 数据流图

```mermaid
graph LR
    subgraph "数据层"
        A[Signal] --> B[Context]
        B --> C[Store]
    end

    subgraph "视图层"
        D[Component] --> E[fdom]
        E --> F[DOM Element]
    end

    subgraph "控制层"
        G[Effect] --> H[Hook]
        H --> I[Event Handler]
    end

    A -.->|数据绑定| D
    C -.->|状态共享| D
    G -.->|副作用| E
    I -.->|事件处理| A

    style A fill:#ff6b6b
    style D fill:#4ecdc4
    style G fill:#45b7d1
```

## 性能优化策略

```mermaid
mindmap
  root((MVE 性能优化))
    响应式优化
      Signal 缓存
      批量更新
      依赖追踪
      懒计算
    DOM 优化
      虚拟滚动
      条件渲染
      Key 优化
      事件委托
    动画优化
      GPU 加速
      预加载
      帧率控制
      内存管理
    路由优化
      代码分割
      预加载
      缓存策略
      懒加载
```

## 组件通信模式

```d2
direction: down

parent: {
  label: "父组件"
  shape: rectangle
  style.fill: "#ff6b6b"
}

child1: {
  label: "子组件 A"
  shape: rectangle
  style.fill: "#4ecdc4"
}

child2: {
  label: "子组件 B"
  shape: rectangle
  style.fill: "#45b7d1"
}

context: {
  label: "Context"
  shape: cylinder
  style.fill: "#96ceb4"
}

signal: {
  label: "Signal"
  shape: cylinder
  style.fill: "#feca57"
}

parent -> child1: "Props 传递"
parent -> child2: "Props 传递"
child1 -> parent: "事件回调"
child2 -> parent: "事件回调"

context -> parent: "provide"
context -> child1: "consume"
context -> child2: "consume"

signal -> parent: "订阅"
signal -> child1: "订阅"
signal -> child2: "订阅"
```

## 状态管理模式

```mermaid
stateDiagram-v2
    [*] --> Idle: 初始化

    Idle --> Loading: 开始加载
    Loading --> Success: 加载成功
    Loading --> Error: 加载失败

    Success --> Idle: 重置
    Error --> Idle: 重试
    Error --> Loading: 重新加载

    Success --> Updating: 更新数据
    Updating --> Success: 更新成功
    Updating --> Error: 更新失败

    note right of Loading
        显示加载状态
        禁用用户操作
    end note

    note right of Success
        显示数据
        启用用户操作
    end note

    note right of Error
        显示错误信息
        提供重试选项
    end note
```

## 构建流程

```mermaid
gitgraph
    commit id: "开发环境"
    branch feature
    checkout feature
    commit id: "功能开发"
    commit id: "单元测试"
    checkout main
    merge feature
    commit id: "集成测试"
    branch release
    checkout release
    commit id: "构建优化"
    commit id: "性能测试"
    checkout main
    merge release
    commit id: "生产部署"
```

## 错误处理流程

```mermaid
flowchart TD
    A[应用启动] --> B{初始化检查}
    B -->|成功| C[正常运行]
    B -->|失败| D[显示启动错误]

    C --> E{运行时错误}
    E -->|无错误| C
    E -->|组件错误| F[错误边界处理]
    E -->|网络错误| G[网络重试]
    E -->|路由错误| H[404 页面]

    F --> I[降级渲染]
    G --> J{重试成功?}
    J -->|是| C
    J -->|否| K[显示错误信息]

    H --> L[返回首页]
    I --> M[错误上报]
    K --> M

    style A fill:#96ceb4
    style D fill:#ff6b6b
    style F fill:#feca57
    style M fill:#ff9ff3
```

## 测试策略

```d2
direction: right

testing: {
  label: "MVE 测试策略"

  unit: {
    label: "单元测试"
    shape: rectangle
    style.fill: "#ff6b6b"

    signal_test: "Signal 测试"
    context_test: "Context 测试"
    hook_test: "Hook 测试"
  }

  integration: {
    label: "集成测试"
    shape: rectangle
    style.fill: "#4ecdc4"

    component_test: "组件测试"
    router_test: "路由测试"
    animation_test: "动画测试"
  }

  e2e: {
    label: "端到端测试"
    shape: rectangle
    style.fill: "#45b7d1"

    user_flow: "用户流程"
    performance: "性能测试"
    accessibility: "无障碍测试"
  }
}

tools: {
  label: "测试工具"

  vitest: {
    label: "Vitest"
    shape: cylinder
    style.fill: "#96ceb4"
  }

  playwright: {
    label: "Playwright"
    shape: cylinder
    style.fill: "#feca57"
  }

  lighthouse: {
    label: "Lighthouse"
    shape: cylinder
    style.fill: "#ff9ff3"
  }
}

testing.unit -> tools.vitest
testing.integration -> tools.vitest
testing.e2e -> tools.playwright
testing.e2e -> tools.lighthouse
```

## 部署架构

```mermaid
C4Context
    title MVE 应用部署架构

    Person(user, "用户", "使用 MVE 应用")

    System_Boundary(app, "MVE 应用") {
        Container(web, "Web 应用", "TypeScript, MVE", "单页应用")
        Container(api, "API 服务", "Node.js", "后端 API")
        ContainerDb(db, "数据库", "PostgreSQL", "数据存储")
    }

    System_Ext(cdn, "CDN", "静态资源分发")
    System_Ext(monitor, "监控系统", "应用性能监控")

    Rel(user, web, "访问应用")
    Rel(web, api, "API 调用")
    Rel(api, db, "数据查询")
    Rel(web, cdn, "加载静态资源")
    Rel(web, monitor, "性能数据")
    Rel(api, monitor, "监控数据")
```

## 开发工作流

```mermaid
journey
    title MVE 开发工作流
    section 需求分析
      理解需求: 5: 产品经理, 开发者
      技术方案: 4: 架构师, 开发者
      任务分解: 3: 开发者
    section 开发阶段
      环境搭建: 4: 开发者
      编码实现: 5: 开发者
      单元测试: 4: 开发者
      代码审查: 3: 团队
    section 测试部署
      集成测试: 4: 测试工程师
      性能测试: 3: 测试工程师
      部署上线: 5: 运维工程师
      监控反馈: 4: 运维工程师
```

这个图表文档涵盖了 MVE 的各个方面：

1. **整体架构** - 展示 MVE 生态系统的层次结构
2. **响应式系统** - 核心的 Signal/Context/Effect 架构
3. **组件生命周期** - 组件从创建到销毁的完整流程
4. **路由系统** - 基于目录的路由匹配和渲染流程
5. **动画系统** - 视图切换和 CSS 过渡动画架构
6. **数据流** - 数据在各层之间的流动
7. **性能优化** - 各个层面的优化策略
8. **组件通信** - 不同的组件间通信模式
9. **状态管理** - 应用状态的变化流程
10. **构建流程** - 从开发到部署的完整流程
11. **错误处理** - 各种错误情况的处理策略
12. **测试策略** - 完整的测试体系
13. **部署架构** - 生产环境的部署结构
14. **开发工作流** - 团队协作的完整流程

这些图表使用了多种图表类型（Mermaid、D2、PlantUML、C4），能够从不同角度全面展示 MVE 框架的知识体系。
