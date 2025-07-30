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

创建 `tailwind.config.js`：

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("daisyui")
  ],
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee", "emerald", "corporate"],
  },
}
```

更新 `vite.config.ts`：

```typescript
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
})
```

## 应用入口设置

修改 `src/main.ts`（基于实际项目模式）：

```typescript
import './style.css'
import { createRoot, fdom, svg } from 'mve-dom'
import { IconContext } from "mve-icons";
import { renderPop } from 'mve-dom-helper'
import { routerProvide } from 'daisy-mobile-helper'
import { createTreeRoute, argForceNumber, renderOneKey, getBranchKey } from 'mve-helper';
import { createBrowserHistory } from 'history';
import { destroyGlobalHolder } from 'mve-core';

const app = document.querySelector<HTMLDivElement>('#app')!

// 基于文件系统的路由（实际项目模式）
const pages = import.meta.glob('./pages/**')
const { renderBranch, getBranch, preLoad } = createTreeRoute({
  treeArg: {
    number: argForceNumber
  },
  pages,
  prefix: './pages/',
  renderError
})

createRoot(app, () => {
  // 路由提供者（实际项目必备）
  const { getHistoryState, router } = routerProvide(createBrowserHistory())
  
  // 图标系统配置（实际项目标配）
  IconContext.provide({
    renderItem(tag, attrs, children) {
      svg[tag as 'svg'](attrs).render(children)
    },
    renderRoot(attrs, children) {
      svg.svg({
        ...attrs,
        fill: "currentColor",
        stroke: 'currentColor',
        strokeWidth: '0'
      }).render(children)
    }
  })

  // 主应用容器
  fdom.div({
    className: 'w-full h-full relative',
    children() {
      // 路由渲染（实际项目核心）
      renderOneKey(
        getBranch(() => getHistoryState().pathname),
        getBranchKey,
        function (key, get) {
          renderBranch(get)
        }
      )
    }
  })

  // 全局弹窗容器（实际项目必备）
  renderPop()
});

// 错误处理组件
function renderError(message: string) {
  fdom.div({
    role: 'alert',
    className: 'alert alert-error',
    children() {
      fdom.svg({
        xmlns: 'http://www.w3.org/2000/svg',
        className: 'h-6 w-6 shrink-0 stroke-current',
        fill: 'none',
        viewBox: '0 0 24 24',
        children() {
          fdom.path({
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
          })
        }
      })
      fdom.span({
        childrenType: 'text',
        children: message,
      })
    }
  })
}

// 清理函数
window.addEventListener("unload", destroyGlobalHolder)
```

## 创建首页

创建 `src/pages/home/index.ts`：

```typescript
import { fdom } from "mve-dom";
import { createSignal, memo } from "wy-helper";
import { renderArray, renderIf } from "mve-helper";
import { FaPlus, FaTrash, FaCheck } from "mve-icons/fa";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

export default function HomePage() {
  // 状态管理（实际项目模式）
  const todos = createSignal<Todo[]>([
    { id: 1, text: "学习 MVE 框架", completed: false, createdAt: new Date() },
    { id: 2, text: "构建实际应用", completed: true, createdAt: new Date() }
  ]);
  
  const newTodoText = createSignal("");
  const filter = createSignal<"all" | "active" | "completed">("all");

  // 计算属性（实际项目常用）
  const filteredTodos = memo(() => {
    const allTodos = todos.get();
    const currentFilter = filter.get();
    
    switch (currentFilter) {
      case "active":
        return allTodos.filter(todo => !todo.completed);
      case "completed":
        return allTodos.filter(todo => todo.completed);
      default:
        return allTodos;
    }
  });

  const stats = memo(() => {
    const allTodos = todos.get();
    return {
      total: allTodos.length,
      completed: allTodos.filter(t => t.completed).length,
      active: allTodos.filter(t => !t.completed).length
    };
  });

  // 操作函数
  function addTodo() {
    const text = newTodoText.get().trim();
    if (!text) return;

    const newTodo: Todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date()
    };

    todos.set([...todos.get(), newTodo]);
    newTodoText.set("");
  }

  function toggleTodo(id: number) {
    todos.set(
      todos.get().map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  function deleteTodo(id: number) {
    todos.set(todos.get().filter(todo => todo.id !== id));
  }

  // 渲染主界面（使用 Tailwind CSS + DaisyUI）
  fdom.div({
    className: "min-h-screen bg-base-200",
    children() {
      fdom.div({
        className: "container mx-auto px-4 py-8 max-w-4xl",
        children() {
          // 头部
          fdom.div({
            className: "text-center mb-8",
            children() {
              fdom.h1({
                className: "text-4xl font-bold text-base-content mb-4",
                childrenType: "text",
                children: "MVE 待办应用"
              });

              fdom.p({
                className: "text-base-content/70",
                childrenType: "text",
                children: "基于实际项目模式构建的示例应用"
              });
            }
          });

          // 统计卡片
          StatsCards();
          
          // 添加待办表单
          AddTodoForm();
          
          // 过滤器
          FilterTabs();
          
          // 待办列表
          TodoList();
        }
      });
    }
  });

  // 统计卡片组件
  function StatsCards() {
    fdom.div({
      className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
      children() {
        const cards = [
          { label: "总计", value: () => stats().total, color: "primary" },
          { label: "已完成", value: () => stats().completed, color: "success" },
          { label: "待完成", value: () => stats().active, color: "warning" }
        ];

        renderArray(() => cards, (card) => {
          fdom.div({
            className: "card bg-base-100 shadow-xl",
            children() {
              fdom.div({
                className: "card-body",
                children() {
                  fdom.h2({
                    className: "card-title text-base-content/70",
                    childrenType: "text",
                    children: card.label
                  });

                  fdom.p({
                    className: `text-3xl font-bold text-${card.color}`,
                    childrenType: "text",
                    children() {
                      return card.value().toString();
                    }
                  });
                }
              });
            }
          });
        });
      }
    });
  }

  // 添加待办表单
  function AddTodoForm() {
    fdom.div({
      className: "card bg-base-100 shadow-xl mb-8",
      children() {
        fdom.div({
          className: "card-body",
          children() {
            fdom.div({
              className: "flex gap-4",
              children() {
                fdom.input({
                  type: "text",
                  placeholder: "添加新的待办事项...",
                  className: "input input-bordered flex-1",
                  value() {
                    return newTodoText.get();
                  },
                  onInput(e) {
                    const target = e.target as HTMLInputElement;
                    newTodoText.set(target.value);
                  },
                  onKeyDown(e) {
                    if (e.key === "Enter") {
                      addTodo();
                    }
                  }
                });

                fdom.button({
                  onClick: addTodo,
                  disabled() {
                    return !newTodoText.get().trim();
                  },
                  className: "btn btn-primary",
                  children() {
                    FaPlus(() => {}, "16px");
                    fdom.span({
                      className: "ml-2",
                      childrenType: "text",
                      children: "添加"
                    });
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  // 过滤器标签
  function FilterTabs() {
    fdom.div({
      className: "tabs tabs-boxed mb-6 justify-center",
      children() {
        const filters: Array<{ key: "all" | "active" | "completed"; label: string }> = [
          { key: "all", label: "全部" },
          { key: "active", label: "待完成" },
          { key: "completed", label: "已完成" }
        ];

        renderArray(() => filters, (filterItem) => {
          fdom.button({
            onClick() {
              filter.set(filterItem.key);
            },
            className() {
              return `tab ${filter.get() === filterItem.key ? "tab-active" : ""}`;
            },
            childrenType: "text",
            children: filterItem.label
          });
        });
      }
    });
  }

  // 待办列表
  function TodoList() {
    fdom.div({
      className: "space-y-4",
      children() {
        renderIf(
          () => filteredTodos().length === 0,
          () => {
            // 空状态
            fdom.div({
              className: "text-center py-12",
              children() {
                fdom.div({
                  className: "text-6xl mb-4",
                  childrenType: "text",
                  children: "📝"
                });

                fdom.p({
                  className: "text-xl text-base-content/70",
                  childrenType: "text",
                  children() {
                    const currentFilter = filter.get();
                    switch (currentFilter) {
                      case "active":
                        return "没有待完成的事项";
                      case "completed":
                        return "还没有完成任何事项";
                      default:
                        return "还没有任何待办事项";
                    }
                  }
                });
              }
            });
          },
          () => {
            // 待办列表
            renderArray(filteredTodos, (todo) => {
              TodoItem({ todo });
            });
          }
        );
      }
    });
  }

  // 待办项组件
  function TodoItem({ todo }: { todo: Todo }) {
    fdom.div({
      className: "card bg-base-100 shadow-sm hover:shadow-md transition-shadow",
      children() {
        fdom.div({
          className: "card-body p-4",
          children() {
            fdom.div({
              className: "flex items-center gap-4",
              children() {
                // 完成状态复选框
                fdom.button({
                  onClick() {
                    toggleTodo(todo.id);
                  },
                  className: `btn btn-circle btn-sm ${todo.completed ? "btn-success" : "btn-outline"}`,
                  children() {
                    if (todo.completed) {
                      FaCheck(() => {}, "12px");
                    }
                  }
                });

                // 待办内容
                fdom.div({
                  className: "flex-1",
                  children() {
                    fdom.p({
                      className: `${todo.completed ? "line-through text-base-content/50" : "text-base-content"}`,
                      childrenType: "text",
                      children: todo.text
                    });

                    fdom.p({
                      className: "text-sm text-base-content/50",
                      childrenType: "text",
                      children() {
                        return `创建于 ${todo.createdAt.toLocaleDateString()}`;
                      }
                    });
                  }
                });

                // 删除按钮
                fdom.button({
                  onClick() {
                    deleteTodo(todo.id);
                  },
                  className: "btn btn-ghost btn-sm text-error",
                  children() {
                    FaTrash(() => {}, "14px");
                  }
                });
              }
            });
          }
        });
      }
    });
  }
}
```

## 全局样式配置

更新 `src/style.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 全局样式 */
html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
}

/* 自定义组件样式 */
.loading-spinner {
  @apply animate-spin rounded-full h-8 w-8 border-b-2 border-primary;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .container {
    @apply px-2;
  }
}
```

## 运行项目

```bash
npm run dev
```

打开浏览器访问 `http://localhost:5173`，你将看到一个基于实际项目模式的完整待办应用。

## 核心特性说明

### 1. 基于文件系统的路由

实际项目中使用 `createTreeRoute` 实现基于文件系统的路由：

- `pages/home/index.ts` - 首页组件
- `pages/home/layout.ts` - 首页布局（可选）
- `pages/user/[id]/index.ts` - 动态路由

### 2. Tailwind CSS + DaisyUI 样式系统

实际项目标配的样式方案：

- **Tailwind CSS**：原子化 CSS 框架
- **DaisyUI**：基于 Tailwind 的组件库
- **响应式设计**：移动端优先的设计理念

### 3. 图标系统集成

使用 `IconContext` 和 `mve-icons` 统一管理图标：

```typescript
import { FaPlus, FaTrash, FaCheck } from "mve-icons/fa";

// 在组件中使用
FaPlus(() => {}, "16px");
```

### 4. 全局弹窗系统

使用 `renderPop()` 管理全局弹窗，支持模态框、提示等。

### 5. 状态管理模式

基于实际项目的状态管理模式：

- **Signal**：响应式状态
- **Memo**：计算属性
- **模块化**：按功能组织状态

## 下一步

现在你已经了解了基于实际项目的 MVE 开发模式，可以：

1. 阅读[核心概念](./core-concepts.md)深入理解框架原理
2. 查看[高级主题](./advanced-topics.md)学习路由、移动端开发等高级功能
3. 参考[API 参考](../api/api-reference.md)了解完整的 API
4. 查看 [demo 目录](../../demo/) 中的更多实际示例

开始构建你的 MVE 应用吧！