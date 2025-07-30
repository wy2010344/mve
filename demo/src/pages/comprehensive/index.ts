/**
 * 高级特性示例 - Context、性能优化、复杂状态管理、通知系统
 * 展示：Context系统、性能优化、复杂状态、通知系统等高级用法
 */

import { fdom } from "mve-dom";
import { createSignal, memo, addEffect, SetValue } from "wy-helper";
import { hookDestroy, hookPromiseSignal, renderArray, renderArrayKey, renderIf, renderOne } from "mve-helper";
import { createContext } from "mve-core";
import { renderInput } from "mve-dom-helper";

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

const currentView = createSignal<"dashboard" | "tasks" | "profile">("dashboard");
// const tasks = createSignal<Task[]>([]);


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
import subHeader from "../sub-header";
import meta from "./meta";
import { gContext } from "../gContext";

export default function () {
  subHeader(meta, function () {

    const { themeColors, theme, addNotification } = gContext.consume()
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
    // 异步数据加载 - 修正：直接在属性中使用 hookPromiseSignal 的 get
    const { get: getUserData, loading: userLoading } = hookPromiseSignal(() => {
      return () => fetchUser();
    });

    const { get: getTasksData, loading: tasksLoading, reduceSet: updateTasks } = hookPromiseSignal(() => {
      return () => fetchTasks();
    });

    // 副作用处理 - 修正：使用 addEffect 而不是 hookTrackSignal
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

    // Context 值
    // 主容器 - 修正：使用正确的 Context 提供方式
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
                renderOne(() => currentView.get(), (view) => {
                  switch (view) {
                    case "dashboard":
                      Dashboard();
                      break;
                    case "tasks":
                      TasksView();
                      break;
                    case "profile":
                      ProfileView();
                      break;
                  }
                });
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
                { id: "profile", label: "个人资料", icon: "👤" }
              ];

              fdom.ul({
                className: "space-y-2",
                children() {
                  menuItems.forEach(item => {
                    fdom.li({
                      children() {
                        fdom.button({
                          onClick() {
                            currentView.set(item.id as any);
                          },
                          className() {
                            const isActive = currentView.get() === item.id;
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

          // 用户信息 - 修正：直接使用 hookPromiseSignal 的 get
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
          // 修正：直接在属性中使用 hookPromiseSignal 的结果
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
              const viewTitles = {
                dashboard: "📊 仪表盘",
                tasks: "✅ 任务管理",
                profile: "👤 个人资料"
              };
              return viewTitles[currentView.get()];
            }
          });

        }
      });
    }

    function Dashboard() {
      const colors = themeColors();
      const stats = taskStats();

      fdom.div({
        className: "space-y-6",
        children() {
          // 统计卡片
          fdom.div({
            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
            children() {
              const statCards = [
                { label: "总任务", value: stats.total, color: "blue", icon: "📋" },
                { label: "待办", value: stats.todo, color: "yellow", icon: "⏳" },
                { label: "进行中", value: stats.doing, color: "purple", icon: "🔄" },
                { label: "已完成", value: stats.done, color: "green", icon: "✅" }
              ];

              statCards.forEach(card => {
                fdom.div({
                  className() {
                    return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`;
                  },
                  children() {
                    fdom.div({
                      className: "flex items-center justify-between",
                      children() {
                        fdom.div({
                          children() {
                            fdom.p({
                              className() {
                                return `text-sm ${colors.textSecondary} mb-1`;
                              },
                              childrenType: "text",
                              children: card.label
                            });

                            fdom.p({
                              className: `text-3xl font-bold text-${card.color}-600`,
                              childrenType: "text",
                              children: card.value.toString()
                            });
                          }
                        });

                        fdom.div({
                          className: "text-4xl opacity-20",
                          childrenType: "text",
                          children: card.icon
                        });
                      }
                    });
                  }
                });
              });
            }
          });

          // 最近任务
          fdom.div({
            className() {
              return `${colors.cardBg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden`;
            },
            children() {
              fdom.div({
                className() {
                  return `p-6 ${colors.border} border-b`;
                },
                children() {
                  fdom.h3({
                    className: "text-lg font-semibold",
                    childrenType: "text",
                    children: "📝 最近任务"
                  });
                }
              });

              fdom.div({
                className: "p-6",
                children() {
                  renderIf(
                    tasksLoading,
                    () => {
                      fdom.div({
                        className: "text-center py-8",
                        childrenType: "text",
                        children: "加载中..."
                      });
                    }
                  );
                  renderIf(
                    () => getTasks().length == 0,
                    function () {
                      fdom.p({
                        className() {
                          return `text-center ${colors.textSecondary} py-8`;
                        },
                        childrenType: "text",
                        children: "暂无任务"
                      });
                    }, function () {
                      fdom.div({
                        className: "space-y-4",
                        children() {
                          renderArrayKey(() => getTasks().slice(0, 5), v => v.id, function (getTask) {

                            fdom.div({
                              className() {
                                return `flex items-center gap-4 p-4 rounded-lg ${colors.hover} transition-colors duration-200`;
                              },
                              children() {
                                // 状态指示器
                                fdom.div({
                                  className() {
                                    const statusColors = {
                                      todo: "bg-yellow-500",
                                      doing: "bg-purple-500",
                                      done: "bg-green-500"
                                    };
                                    return `w-3 h-3 rounded-full ${statusColors[getTask().status]}`;
                                  }
                                });

                                fdom.div({
                                  className: "flex-1",
                                  children() {
                                    fdom.h4({
                                      className: "font-medium mb-1",
                                      childrenType: "text",
                                      children() {
                                        return getTask().title
                                      }
                                    });

                                    fdom.p({
                                      className() {
                                        return `text-sm ${colors.textSecondary}`;
                                      },
                                      childrenType: "text",
                                      children() {
                                        return getTask().description
                                      }
                                    });
                                  }
                                });

                                fdom.div({
                                  className: "text-right",
                                  children() {
                                    fdom.span({
                                      className() {
                                        const priorityColors = {
                                          low: "bg-gray-100 text-gray-800",
                                          medium: "bg-yellow-100 text-yellow-800",
                                          high: "bg-red-100 text-red-800"
                                        };
                                        return `px-2 py-1 rounded-full text-xs font-medium ${priorityColors[getTask().priority]}`;
                                      },
                                      childrenType: "text",
                                      children() {
                                        return getTask().priority
                                      }
                                    });
                                  }
                                });
                              }
                            });
                          })
                        }
                      });
                    })
                }
              });
            }
          });
        }
      });
    }

    function TasksView() {
      const colors = themeColors();

      fdom.div({
        className: "space-y-6",
        children() {
          // 任务列表
          fdom.div({
            className() {
              return `${colors.cardBg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden`;
            },
            children() {
              fdom.div({
                className() {
                  return `p-6 ${colors.border} border-b`;
                },
                children() {
                  fdom.h3({
                    className: "text-lg font-semibold",
                    childrenType: "text",
                    children: "📋 所有任务"
                  });
                }
              });

              fdom.div({
                className: "divide-y divide-gray-200 dark:divide-gray-700",
                children() {
                  renderIf(
                    tasksLoading,
                    () => {
                      fdom.div({
                        className: "p-8 text-center",
                        childrenType: "text",
                        children: "加载任务中..."
                      });
                    },
                    () => {
                      renderArrayKey(
                        getTasks,
                        (task) => task.id,
                        (getTask) => {
                          fdom.div({
                            className() {
                              return `p-6 ${colors.hover} transition-colors duration-200`;
                            },
                            children() {
                              fdom.div({
                                className: "flex items-start justify-between",
                                children() {
                                  fdom.div({
                                    className: "flex-1",
                                    children() {
                                      fdom.div({
                                        className: "flex items-center gap-3 mb-2",
                                        children() {
                                          fdom.h3({
                                            className: "text-lg font-semibold",
                                            childrenType: "text",
                                            children() {
                                              return getTask().title
                                            }
                                          });

                                          fdom.span({
                                            className() {
                                              const priorityColors = {
                                                low: "bg-gray-100 text-gray-800",
                                                medium: "bg-yellow-100 text-yellow-800",
                                                high: "bg-red-100 text-red-800"
                                              };
                                              return `px-2 py-1 rounded-full text-xs font-medium ${priorityColors[getTask().priority]}`;
                                            },
                                            childrenType: "text",
                                            children() {
                                              return getTask().priority
                                            }
                                          });
                                        }
                                      });

                                      fdom.p({
                                        className() {
                                          return `${colors.textSecondary} mb-3`;
                                        },
                                        childrenType: "text",
                                        children() {
                                          return getTask().priority
                                        }
                                      });

                                      // 标签
                                      fdom.div({
                                        className: "flex flex-wrap gap-2",
                                        children() {
                                          renderArray(() => getTask().tags, function (tag) {
                                            fdom.span({
                                              className: "px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs",
                                              childrenType: "text",
                                              children: tag
                                            });
                                          })
                                        }
                                      });
                                    }
                                  });

                                  fdom.div({
                                    className: "ml-4",
                                    children() {
                                      // 状态选择
                                      renderInput(
                                        () => getTask().status,
                                        value => {
                                          updateTaskStatus(getTask().id, value as Task["status"])
                                        },
                                        fdom.select({
                                          className() {
                                            const statusColors = {
                                              todo: "bg-yellow-100 text-yellow-800 border-yellow-300",
                                              doing: "bg-purple-100 text-purple-800 border-purple-300",
                                              done: "bg-green-100 text-green-800 border-green-300"
                                            };
                                            return `px-3 py-1 rounded-lg text-sm font-medium border ${statusColors[getTask().status]}`;
                                          },
                                          children() {
                                            const options = [
                                              { value: "todo", label: "待办" },
                                              { value: "doing", label: "进行中" },
                                              { value: "done", label: "已完成" }
                                            ];

                                            options.forEach(option => {
                                              fdom.option({
                                                value: option.value,
                                                childrenType: "text",
                                                children: option.label
                                              });
                                            });
                                          }
                                        }));
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      );
                    }
                  );
                }
              });
            }
          });
        }
      });
    }

    function ProfileView() {
      const colors = themeColors();

      fdom.div({
        className: "max-w-2xl mx-auto space-y-6",
        children() {
          renderIf(() => !userLoading() && !getUserData(), function () {

            fdom.div({
              className: "text-center py-12",
              children() {
                fdom.p({
                  className() {
                    return colors.textSecondary;
                  },
                  childrenType: "text",
                  children: "请先登录"
                });
              }
            });
          })
          renderIf(
            userLoading,
            () => {
              fdom.div({
                className: "text-center py-12",
                childrenType: "text",
                children: "加载中..."
              });
            }
          );
          renderOne(getUserData, function (o) {
            if (o?.type == 'success') {
              const user = o.value

              // 用户信息卡片
              fdom.div({
                className() {
                  return `${colors.cardBg} ${colors.border} border rounded-2xl p-8 shadow-lg text-center`;
                },
                children() {
                  fdom.div({
                    className: "w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl text-white",
                    childrenType: "text",
                    children: user.avatar
                  });

                  fdom.h2({
                    className: "text-2xl font-bold mb-2",
                    childrenType: "text",
                    children: user.name
                  });

                  fdom.p({
                    className() {
                      return colors.textSecondary;
                    },
                    childrenType: "text",
                    children: user.email
                  });
                }
              });

              // 统计信息
              fdom.div({
                className() {
                  return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
                },
                children() {
                  fdom.h3({
                    className: "text-lg font-semibold mb-4",
                    childrenType: "text",
                    children: "📊 我的统计"
                  });

                  fdom.div({
                    className: "grid grid-cols-3 gap-4 text-center",
                    children() {
                      const stats = taskStats();
                      const userStats = [
                        { label: "总任务", value: stats.total },
                        { label: "已完成", value: stats.done },
                        { label: "进行中", value: stats.doing }
                      ];

                      userStats.forEach(stat => {
                        fdom.div({
                          children() {
                            fdom.div({
                              className: "text-2xl font-bold text-blue-500 mb-1",
                              childrenType: "text",
                              children: stat.value.toString()
                            });

                            fdom.div({
                              className() {
                                return `text-sm ${colors.textSecondary}`;
                              },
                              childrenType: "text",
                              children: stat.label
                            });
                          }
                        });
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
  })
}