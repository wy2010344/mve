/**
 * 基础示例：展示如何在 MVE 应用中使用 convex-mve
 * 这是一个参考实现，展示了常见的用法模式
 */

import { render } from 'mve-core'
import { fdom } from 'mve-dom'
import { renderIf, renderArrayKey, hookTrackSignalSkipFirst } from 'mve-helper'
import { createSignal } from 'wy-helper'
import { ConvexHttpClient } from 'convex/browser'
import {
  provideConvexClient,
  hookConvexQuery,
  useConvexMutation,
} from '../index'

// 假设你有这些 Convex API 定义
// import { api } from '../convex/_generated/api';

/**
 * 初始化 Convex 客户端
 */
function initializeApp() {
  const convex = new ConvexHttpClient(
    (import.meta as any).env?.VITE_CONVEX_URL || 'http://localhost:3210'
  )

  // 在应用根部提供客户端
  provideConvexClient(convex)
}

/**
 * 示例 1: 基础查询
 */
function BasicQueryExample() {
  // 使用查询 hook
  // const getTodos = useConvexQuery(api.todos.list);

  fdom.div({
    className: 'todos-container',
    children() {
      // const result = getTodos();
      // 使用 renderIf 处理加载状态
      // renderIf(
      //   () => result?.isLoading,
      //   () => fdom.p({ children: '加载中...' }),
      //   () => {
      //     if (result?.error) {
      //       fdom.p({
      //         s_color: 'red',
      //         children: `错误: ${result.error.message}`,
      //       });
      //     } else if (result?.data) {
      //       fdom.ul({
      //         children() {
      //           result.data.forEach((todo: any) => {
      //             fdom.li({
      //               className: 'todo-item',
      //               children: todo.text,
      //             });
      //           });
      //         },
      //       });
      //     }
      //   }
      // );
    },
  })
}

/**
 * 示例 2: 动态参数的查询
 */
function DynamicQueryExample() {
  const userId = createSignal('user-1')

  // 参数会在 userId 改变时自动重新获取
  // const getUser = useConvexQuery(
  //   api.users.getById,
  //   () => ({ userId: userId.get() })
  // );

  fdom.div({
    children() {
      // 选择用户的按钮
      fdom.button({
        onClick() {
          userId.set(userId.get() === 'user-1' ? 'user-2' : 'user-1')
        },
        childrenType: 'text',
        children() {
          return `切换用户 (当前: ${userId.get()})`
        },
      })

      // const result = getUser();
      // if (result?.data) {
      //   fdom.div({
      //     children() {
      //       fdom.h2({ children: result.data.name });
      //       fdom.p({ children: result.data.email });
      //     },
      //   });
      // }
    },
  })
}

/**
 * 示例 3: Mutation (创建)
 */
function CreateTodoExample() {
  // const { mutate, get } = useConvexMutation(api.todos.create);
  const input = createSignal('')

  fdom.div({
    children() {
      fdom.form({
        onSubmit(e: any) {
          e.preventDefault()
          // 调用 mutation
          // mutate({ text: input.get() }).then(() => {
          //   input.set('');
          // });
        },
        children() {
          fdom.input({
            type: 'text',
            value: input.get(),
            onInput(e: Event) {
              input.set((e.target as HTMLInputElement).value)
            },
            placeholder: '输入新的待办事项',
          })

          fdom.button({
            type: 'submit',
            childrenType: 'text',
            children() {
              // const state = get();
              // return state?.isPending ? '正在保存...' : '添加';
              return '添加'
            },
          })

          // const state = get();
          // if (state?.error) {
          //   fdom.p({
          //     s_color: 'red',
          //     children: `错误: ${state.error.message}`,
          //   });
          // }
        },
      })
    },
  })
}

/**
 * 示例 4: 列表渲染 + Mutation
 */
function TodoListWithActionsExample() {
  // const getTodos = useConvexQuery(api.todos.list);
  // const { mutate: deleteTodo } = useConvexMutation(api.todos.delete);
  // const { mutate: updateTodo } = useConvexMutation(api.todos.update);

  fdom.div({
    children() {
      // const result = getTodos();
      // renderArrayKey(
      //   () => result?.data || [],
      //   (todo) => todo._id,
      //   (getItem, getIndex) => {
      //     fdom.div({
      //       className: 'todo-item',
      //       s_display: 'flex',
      //       s_justifyContent: 'space-between',
      //       children() {
      //         const todo = getItem();
      //         fdom.span({ children: todo.text });
      //         fdom.div({
      //           children() {
      //             fdom.button({
      //               onClick() {
      //                 updateTodo({
      //                   id: todo._id,
      //                   completed: !todo.completed,
      //                 });
      //               },
      //               childrenType: 'text',
      //               children: todo.completed ? '未完成' : '完成',
      //             });
      //             fdom.button({
      //               onClick() {
      //                 deleteTodo({ id: todo._id });
      //               },
      //               childrenType: 'text',
      //               children: '删除',
      //             });
      //           },
      //         });
      //       },
      //     });
      //   }
      // );
    },
  })
}

/**
 * 示例 5: 完整的应用示例
 */
function TodoApp() {
  fdom.div({
    className: 'app',
    s_maxWidth: '600px',
    s_margin: '0 auto',
    s_padding: '20px',
    children() {
      fdom.h1({ children: '我的待办事项' })

      CreateTodoExample()
      TodoListWithActionsExample()
    },
  })
}

/**
 * 应用入口
 */
export function initializeAndRender() {
  // 初始化 Convex 客户端
  initializeApp()

  // 渲染应用
  render(() => {
    TodoApp()
  })
}

// 如果在浏览器环境中，则自动初始化
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeAndRender()
  })
}
