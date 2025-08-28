/**
 * 实战应用示例 - 完整的任务管理应用
 * 展示：状态管理、异步处理、Context、最佳实践
 */

import { fdom } from "mve-dom";
import { createSignal, memo, addEffect } from "wy-helper";
import { renderArrayKey, renderIf, renderOne, hookPromiseSignal, BranchLoaderParam, renderOneKey, getBranchKey, hookDestroy } from "mve-helper";
import { createContext } from "mve-core";
import { renderInput } from "mve-dom-helper";
import { routerConsume } from "mve-dom-helper/history";

import subHeader from "../sub-header";
import meta from "./meta";
import { gContext } from "../gContext";
import comprehensiveContext from "./comprehensive-context";

// 类型定义
interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "doing" | "done";
  priority: "low" | "medium" | "high";
  assignee: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// 模拟 API
async function fetchUser(): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    id: 1,
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "👤"
  };
}

async function fetchTasks(): Promise<Task[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    {
      id: 1,
      title: "学习 MVE 框架",
      description: "深入了解 MVE 框架的核心概念和最佳实践",
      status: "doing",
      priority: "high",
      assignee: 1,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date(),
      tags: ["学习", "框架"]
    },
    {
      id: 2,
      title: "优化应用性能",
      description: "使用 memo 和 Signal 优化应用性能",
      status: "todo",
      priority: "medium",
      assignee: 1,
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date(),
      tags: ["性能", "优化"]
    },
    {
      id: 3,
      title: "编写项目文档",
      description: "为项目编写详细的使用文档和 API 说明",
      status: "done",
      priority: "low",
      assignee: 1,
      createdAt: new Date("2024-01-03"),
      updatedAt: new Date(),
      tags: ["文档", "写作"]
    }
  ];
}

export default function (e: BranchLoaderParam) {
  subHeader(meta, function () {
    const { router, getHistoryState } = routerConsume()
    const { themeColors, theme, addNotification, renderBranch } = gContext.consume()

    const taskStats = memo((old: any, inited: boolean) => {
      const allTasks = getTasks();
      return {
        total: allTasks.length,
        todo: allTasks.filter(t => t.status === "todo").length,
        doing: allTasks.filter(t => t.status === "doing").length,
        done: allTasks.filter(t => t.status === "done").length,
        highPriority: allTasks.filter(t => t.priority === "high").length
      };
    });

    function updateTaskStatus(taskId: number, newStatus: Task["status"]) {
      updateTasks(tasks => {
        return tasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        )
      })
      addNotification({
        type: "success",
        title: "任务更新",
        message: "任务状态已更新"
      });
    }

    function getTasks() {
      const o = getTasksData()
      if (o?.type == 'success') {
        return o.value
      }
      return []
    }

    // 异步数据加载
    const { get: getUserData, loading: userLoading } = hookPromiseSignal(() => {
      return () => fetchUser();
    });

    const { get: getTasksData, loading: tasksLoading, reduceSet: updateTasks } = hookPromiseSignal(() => {
      return () => fetchTasks();
    });

    // 副作用处理
    addEffect(() => {
      const user = getUserData();
      if (user?.type == 'success') {
        addNotification({
          type: "success",
          title: "欢迎回来",
          message: `欢迎回来，${user.value.name}！`
        });
      }
    });

    addEffect(() => {
      const newTheme = theme();
      document.documentElement.setAttribute('data-theme', newTheme);
    });

    // 生命周期
    hookDestroy(() => {
      console.log('实战应用组件销毁');
    });

    // 提供 Context
    comprehensiveContext.provide({
      getUserData,
      userLoading,
      getTasksData,
      tasksLoading,
      getTasks,
      updateTaskStatus,
      taskStats
    });

    // 主容器
    fdom.div({
      className() {
        const colors = themeColors();
        return `h-full ${colors.bg} ${colors.text} transition-colors duration-300 flex`;
      },
      children() {
        // 侧边栏
        Sidebar();

        // 主内容
        fdom.div({
          className: "flex-1 flex flex-col overflow-hidden",
          children() {
            // 顶部导航
            TopNavigation();

            // 内容区域
            fdom.main({
              className: "flex-1 overflow-y-auto p-6",
              children() {
                renderOneKey(e.getChildren, getBranchKey, function (loader, get) {
                  renderBranch(get)
                })
              }
            });
          }
        });
      }
    });

    function Sidebar() {
      const colors = themeColors();

      fdom.aside({
        className() {
          return `w-64 ${colors.cardBg} ${colors.border} border-r flex flex-col`;
        },
        children() {
          // Logo
          fdom.div({
            className: "p-6 border-b border-gray-200 dark:border-gray-700",
            children() {
              fdom.h1({
                className: "text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                childrenType: "text",
                children: "🎯 任务管理"
              });
            }
          });

          // 导航菜单
          fdom.nav({
            className: "flex-1 p-4",
            children() {
              const menuItems = [
                { id: "dashboard", label: "仪表盘", icon: "📊" },
                { id: "tasks", label: "任务管理", icon: "✅" },
                { id: "profile", label: "个人资料", icon: "👤" },
                { id: "async", label: "异步处理", icon: "🔄" }
              ];

              fdom.ul({
                className: "space-y-2",
                children() {
                  menuItems.forEach(item => {
                    const url = e.getAbsolutePath(`./${item.id}`)
                    fdom.li({
                      children() {
                        fdom.button({
                          onClick() {
                            router.replace(url);
                          },
                          className() {
                            const pathname = getHistoryState().pathname
                            const isActive = pathname.startsWith(url)
                            return `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                              ? "bg-blue-500 text-white shadow-lg"
                              : `${colors.text} ${colors.hover}`
                              }`;
                          },
                          children() {
                            fdom.span({
                              className: "text-lg",
                              childrenType: "text",
                              children: item.icon
                            });

                            fdom.span({
                              className: "font-medium",
                              childrenType: "text",
                              children: item.label
                            });
                          }
                        });
                      }
                    });
                  });
                }
              });
            }
          });

          // 用户信息
          UserInfo();
        }
      });
    }

    function UserInfo() {
      const colors = themeColors();

      fdom.div({
        className() {
          return `p-4 border-t ${colors.border}`;
        },
        children() {
          fdom.div({
            children() {
              renderIf(() => !userLoading() && !getUserData(), function () {
                fdom.div({
                  className: "text-center text-gray-500",
                  childrenType: "text",
                  children: "未登录"
                });
              })
              renderIf(
                userLoading,
                () => {
                  fdom.div({
                    className: "text-center text-gray-500",
                    childrenType: "text",
                    children: "加载中..."
                  });
                });
              renderOne(getUserData, function (o) {
                if (o?.type == 'success') {
                  const user = o.value

                  fdom.div({
                    className: "flex items-center gap-3",
                    children() {
                      fdom.div({
                        className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg",
                        childrenType: "text",
                        children: user.avatar
                      });
                      fdom.div({
                        className: "flex-1 min-w-0",
                        children() {
                          fdom.p({
                            className: "font-medium truncate",
                            childrenType: "text",
                            children: user.name
                          });

                          fdom.p({
                            className() {
                              return `text-sm ${colors.textSecondary} truncate`;
                            },
                            childrenType: "text",
                            children: user.email
                          });
                        }
                      });
                    }
                  });
                }
              })
            }
          });
        }
      });
    }

    function TopNavigation() {
      fdom.header({
        className() {
          const colors = themeColors();
          return `${colors.cardBg} ${colors.border} border-b px-6 py-4 flex items-center justify-between`;
        },
        children() {
          fdom.h2({
            className: "text-xl font-semibold",
            childrenType: "text",
            children() {
              const pathname = getHistoryState().pathname;
              const viewTitles: Record<string, string> = {
                dashboard: "📊 仪表盘",
                tasks: "✅ 任务管理",
                profile: "👤 个人资料",
                async: "🔄 异步处理"
              };

              // 从路径中提取当前视图
              const currentView = Object.keys(viewTitles).find(view =>
                pathname.includes(`/${view}`)
              ) || "dashboard";

              return viewTitles[currentView];
            }
          });
        }
      });
    }
  })
}