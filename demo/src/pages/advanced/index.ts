/**
 * 高级特性示例 - Context、性能优化、复杂状态管理、通知系统
 * 展示：Context系统、性能优化、复杂状态、通知系统等高级用法
 */

import { fdom } from "mve-dom";
import { createSignal, memo, addEffect, SetValue } from "wy-helper";
import { hookDestroy, renderArrayKey, renderIf, renderOne } from "mve-helper";
import { createContext } from "mve-core";
import { renderInput } from "mve-dom-helper";

import subHeader from "../sub-header";
import meta from "./meta";
import { gContext } from "../gContext";

export default function () {
  subHeader(meta, function () {
    const { theme, themeColors, toggleTheme, addNotification, getNotifications } = gContext.consume()
    const currentSection = createSignal<"context" | "performance" | "state" | "notifications">("context");

    // 数据状态 - 演示复杂状态管理
    const dataItems = createSignal<DataItem[]>([]);
    const filterCategory = createSignal<string>("all");
    const sortBy = createSignal<"name" | "value" | "timestamp">("name");
    const sortOrder = createSignal<"asc" | "desc">("asc");


    // 性能监控
    const performanceMetrics = createSignal<PerformanceMetrics>({
      renderCount: 0,
      lastRenderTime: 0,
      memoHits: 0,
      memoMisses: 0
    });

    const filteredAndSortedItems = memo((old: any, inited: boolean) => {
      console.log('📊 filteredAndSortedItems 计算', { old, inited });

      const items = dataItems.get();
      const category = filterCategory.get();
      const sort = sortBy.get();
      const order = sortOrder.get();

      // 过滤
      let filtered = items;
      if (category !== "all") {
        filtered = items.filter(item => item.category === category);
      }

      // 排序
      const sorted = [...filtered].sort((a, b) => {
        let comparison = 0;

        switch (sort) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "value":
            comparison = a.value - b.value;
            break;
          case "timestamp":
            comparison = a.timestamp.getTime() - b.timestamp.getTime();
            break;
        }

        return order === "asc" ? comparison : -comparison;
      });

      return sorted;
    });

    const dataStatistics = memo((old: any, inited: boolean) => {
      const items = dataItems.get();
      const categories = [...new Set(items.map(item => item.category))];
      const totalValue = items.reduce((sum, item) => sum + item.value, 0);
      const avgValue = items.length > 0 ? totalValue / items.length : 0;
      const activeCount = items.filter(item => item.status === "active").length;

      return {
        total: items.length,
        categories: categories.length,
        totalValue: Math.round(totalValue),
        avgValue: Math.round(avgValue * 100) / 100,
        activeCount,
        inactiveCount: items.length - activeCount
      };
    });

    // 操作函数
    function generateTestData() {
      const categories = ["技术", "设计", "产品", "运营", "市场"];
      const names = ["项目A", "任务B", "计划C", "方案D", "策略E"];

      const newItems: DataItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: Date.now() + i,
        name: `${names[i % names.length]}${i + 1}`,
        value: Math.floor(Math.random() * 1000) + 1,
        category: categories[Math.floor(Math.random() * categories.length)],
        status: Math.random() > 0.3 ? "active" : "inactive",
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30) // 30天内随机时间
      }));

      dataItems.set(newItems);
      addNotification({
        type: "success",
        title: "数据生成完成",
        message: `已生成 ${newItems.length} 条测试数据`
      });
    }

    function clearData() {
      dataItems.set([]);
      addNotification({
        type: "info",
        title: "数据已清空",
        message: "所有测试数据已被清除"
      });
    }

    function performStressTest() {
      addNotification({
        type: "warning",
        title: "压力测试开始",
        message: "正在执行大量状态更新..."
      });

      const startTime = performance.now();

      // 执行大量状态更新
      for (let i = 0; i < 100; i++) {
        setTimeout(() => {
          const items = dataItems.get();
          if (items.length > 0) {
            const randomIndex = Math.floor(Math.random() * items.length);
            const updatedItems = [...items];
            updatedItems[randomIndex] = {
              ...updatedItems[randomIndex],
              value: Math.floor(Math.random() * 1000),
              timestamp: new Date()
            };
            dataItems.set(updatedItems);
          }

          if (i === 99) {
            const endTime = performance.now();
            addNotification({
              type: "success",
              title: "压力测试完成",
              message: `耗时: ${Math.round(endTime - startTime)}ms`
            });
          }
        }, i * 10);
      }
    }

    // 性能监控 - 修正：使用 addEffect 而不是 hookTrackSignal
    addEffect(() => {
      const start = performance.now();
      const metrics = performanceMetrics.get();
      performanceMetrics.set({
        ...metrics,
        renderCount: metrics.renderCount + 1
      });

      // 在下一个微任务中记录渲染时间
      Promise.resolve().then(() => {
        const end = performance.now();
        const currentMetrics = performanceMetrics.get();
        performanceMetrics.set({
          ...currentMetrics,
          lastRenderTime: Math.round((end - start) * 100) / 100
        });
      });
    });

    // 主题变化副作用 - 修正：使用 addEffect 而不是 hookTrackSignal
    addEffect(() => {
      const newTheme = theme();
      document.documentElement.setAttribute('data-theme', newTheme);

      addNotification({
        type: "info",
        title: "主题已切换",
        message: `已切换到${newTheme === "dark" ? "暗色" : "亮色"}模式`
      });
    });

    // 生命周期
    hookDestroy(() => {
      console.log('高级特性组件销毁');
    });

    // 主容器
    fdom.div({
      className() {
        const colors = themeColors();
        return `h-full ${colors.bg} ${colors.text} transition-colors duration-300`;
      },
      children() {
        // 主布局
        fdom.div({
          className: "max-w-7xl mx-auto p-6",
          children() {
            // 标题和导航
            Header();

            // 内容区域
            fdom.div({
              className: "mt-8",
              children() {
                renderOne(() => currentSection.get(), (section) => {
                  switch (section) {
                    case "context":
                      ContextSection();
                      break;
                    case "performance":
                      PerformanceSection();
                      break;
                    case "state":
                      StateSection();
                      break;
                    case "notifications":
                      NotificationsSection();
                      break;
                  }
                });
              }
            });
          }
        });
      }
    });


    function Header() {
      fdom.div({
        className: "text-center mb-8",
        children() {
          fdom.h1({
            className: "text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4",
            childrenType: "text",
            children: "⚡ MVE 高级特性"
          });

          fdom.p({
            className() {
              return `text-lg ${themeColors().textSecondary} mb-8`;
            },
            childrenType: "text",
            children: "Context 系统、性能优化、复杂状态管理、通知系统等高级用法展示"
          });

          // 导航标签
          fdom.div({
            className: "flex flex-wrap justify-center gap-2",
            children() {
              const sections = [
                { id: "context", label: "Context 系统", icon: "🔗" },
                { id: "performance", label: "性能优化", icon: "⚡" },
                { id: "state", label: "复杂状态", icon: "🧠" },
                { id: "notifications", label: "通知系统", icon: "🔔" }
              ];

              sections.forEach(section => {
                fdom.button({
                  onClick() {
                    currentSection.set(section.id as any);
                  },
                  className() {
                    const isActive = currentSection.get() === section.id;

                    if (isActive) {
                      return "px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium shadow-lg transform scale-105";
                    }

                    const colors = themeColors()
                    return `px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${colors.cardBg
                      } ${colors.border} border ${colors.hover}`;
                  },
                  children() {
                    fdom.span({
                      className: "mr-2",
                      childrenType: "text",
                      children: section.icon
                    });

                    fdom.span({
                      childrenType: "text",
                      children: section.label
                    });
                  }
                });
              });
            }
          });
        }
      });
    }

    function ContextSection() {
      const colors = themeColors();

      fdom.div({
        className: "space-y-8",
        children() {
          fdom.div({
            className: "text-center mb-8",
            children() {
              fdom.h2({
                className: "text-2xl font-bold mb-4",
                childrenType: "text",
                children: "🔗 Context 系统"
              });

              fdom.p({
                className() {
                  return `text-lg ${colors.textSecondary}`;
                },
                childrenType: "text",
                children: "Context 提供跨组件的状态共享和依赖注入能力"
              });
            }
          });

          fdom.div({
            className: "grid grid-cols-1 lg:grid-cols-2 gap-8",
            children() {
              // Context 演示
              ContextDemo();

              // Context 代码示例
              fdom.div({
                className() {
                  return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
                },
                children() {
                  fdom.h3({
                    className: "text-xl font-semibold mb-4",
                    childrenType: "text",
                    children: "💻 Context 用法"
                  });

                  fdom.pre({
                    className() {
                      return `${colors.bg} p-4 rounded-lg overflow-x-auto text-sm`;
                    },
                    childrenType: "text",
                    children: `// 1. 创建 Context
const AppContext = createContext<{
  theme: () => "light" | "dark";
  toggleTheme: () => void;
}>();

// 2. 提供 Context
AppContext.Provider({
  value: contextValue,
  children() {
    // 子组件
  }
});

// 3. 消费 Context
function ChildComponent() {
  const context = AppContext.consume();
  const theme = context.theme();
  
  // 使用 Context 值
}`
                  });
                }
              });
            }
          });
        }
      });
    }

    function ContextDemo() {
      const colors = themeColors();

      fdom.div({
        className() {
          return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
        },
        children() {
          fdom.h3({
            className: "text-xl font-semibold mb-6",
            childrenType: "text",
            children: "🎮 Context 演示"
          });

          // 主题信息显示
          fdom.div({
            className() {
              return `p-4 rounded-xl mb-4 ${colors.bg}`;
            },
            children() {
              fdom.div({
                className: "text-center",
                children() {
                  fdom.div({
                    className: "text-3xl mb-2",
                    childrenType: "text",
                    children() {
                      return theme() === "dark" ? "🌙" : "☀️";
                    }
                  });

                  fdom.p({
                    className: "text-lg font-semibold",
                    childrenType: "text",
                    children() {
                      return `当前主题: ${theme() === "dark" ? "暗色模式" : "亮色模式"}`;
                    }
                  });
                }
              });
            }
          });

          // Context 消费组件
          ThemeConsumer();

          // 操作按钮
          fdom.div({
            className: "flex gap-3 justify-center mt-6",
            children() {
              fdom.button({
                onClick: toggleTheme,
                className: "px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200",
                childrenType: "text",
                children: "切换主题"
              });

              fdom.button({
                onClick() {
                  addNotification({
                    type: "info",
                    title: "Context 测试",
                    message: "这是通过 Context 触发的通知"
                  });
                },
                className() {
                  return `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${colors.border} border ${colors.hover}`;
                },
                childrenType: "text",
                children: "测试通知"
              });
            }
          });
        }
      });
    }

    function ThemeConsumer() {
      const colors = themeColors();

      fdom.div({
        className() {
          return `p-3 rounded-lg ${colors.bg} border-l-4 border-purple-500`;
        },
        children() {
          fdom.p({
            className: "text-sm font-medium mb-2",
            childrenType: "text",
            children: "📡 Context 消费组件"
          });

          fdom.p({
            className() {
              return `text-sm ${colors.textSecondary}`;
            },
            childrenType: "text",
            children() {
              const metrics = performanceMetrics.get()
              return `渲染次数: ${metrics.renderCount} | memo 命中: ${metrics.memoHits}`;
            }
          });
        }
      });
    }

    function PerformanceSection() {
      // const colors = themeColors();
      // const metrics = performanceMetrics.get();

      fdom.div({
        className: "space-y-8",
        children() {
          fdom.div({
            className: "text-center mb-8",
            children() {
              fdom.h2({
                className: "text-2xl font-bold mb-4",
                childrenType: "text",
                children: "⚡ 性能优化"
              });

              fdom.p({
                className() {
                  const colors = themeColors();
                  return `text-lg ${colors.textSecondary}`;
                },
                childrenType: "text",
                children: "memo 缓存、依赖追踪、渲染优化等性能优化技术"
              });
            }
          });

          // 性能指标
          fdom.div({
            className: "grid grid-cols-1 md:grid-cols-4 gap-6 mb-8",
            children() {
              const metricCards = [
                { label: "渲染次数", value: () => performanceMetrics.get().renderCount, icon: "🔄", color: "blue" },
                { label: "渲染耗时", value: () => `${performanceMetrics.get().lastRenderTime}ms`, icon: "⏱️", color: "green" },
                { label: "memo 命中", value: () => performanceMetrics.get().memoHits, icon: "🎯", color: "purple" },
                { label: "memo 未命中", value: () => performanceMetrics.get().memoMisses, icon: "❌", color: "red" }
              ];

              metricCards.forEach(card => {
                fdom.div({
                  className() {
                    const colors = themeColors();
                    return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg text-center`;
                  },
                  children() {
                    fdom.div({
                      className: "text-3xl mb-2",
                      childrenType: "text",
                      children: card.icon
                    });

                    fdom.div({
                      className: `text-2xl font-bold text-${card.color}-600 mb-1`,
                      childrenType: "text",
                      children: card.value
                    });

                    fdom.div({
                      className() {
                        const colors = themeColors();
                        return `text-sm ${colors.textSecondary}`;
                      },
                      childrenType: "text",
                      children: card.label
                    });
                  }
                });
              });
            }
          });

          // 性能测试按钮
          fdom.div({
            className: "flex gap-4 justify-center",
            children() {
              fdom.button({
                onClick: generateTestData,
                className: "px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200",
                childrenType: "text",
                children: "🚀 生成测试数据"
              });

              fdom.button({
                onClick: performStressTest,
                className: "px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200",
                childrenType: "text",
                children: "💥 压力测试"
              });

              fdom.button({
                onClick: clearData,
                className() {
                  const colors = themeColors();
                  return `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${colors.border} border ${colors.hover}`;
                },
                childrenType: "text",
                children: "🗑️ 清空数据"
              });
            }
          });
        }
      });
    }

    function StateSection() {
      const colors = themeColors();
      const stats = dataStatistics();

      fdom.div({
        className: "space-y-8",
        children() {
          fdom.div({
            className: "text-center mb-8",
            children() {
              fdom.h2({
                className: "text-2xl font-bold mb-4",
                childrenType: "text",
                children: "🧠 复杂状态管理"
              });

              fdom.p({
                className() {
                  return `text-lg ${colors.textSecondary}`;
                },
                childrenType: "text",
                children: "多层级状态、复杂计算、智能缓存等状态管理技术"
              });
            }
          });

          // 统计信息
          fdom.div({
            className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8",
            children() {
              const statItems = [
                { label: "总数", value: stats.total, color: "blue" },
                { label: "分类", value: stats.categories, color: "green" },
                { label: "总值", value: stats.totalValue, color: "purple" },
                { label: "平均", value: stats.avgValue, color: "yellow" },
                { label: "活跃", value: stats.activeCount, color: "emerald" },
                { label: "非活跃", value: stats.inactiveCount, color: "gray" }
              ];

              statItems.forEach(item => {
                fdom.div({
                  className() {
                    return `${colors.cardBg} ${colors.border} border rounded-xl p-4 text-center`;
                  },
                  children() {
                    fdom.div({
                      className: `text-xl font-bold text-${item.color}-600 mb-1`,
                      childrenType: "text",
                      children: item.value.toString()
                    });

                    fdom.div({
                      className() {
                        return `text-xs ${colors.textSecondary}`;
                      },
                      childrenType: "text",
                      children: item.label
                    });
                  }
                });
              });
            }
          });

          // 过滤和排序控制
          fdom.div({
            className() {
              return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg mb-6`;
            },
            children() {
              fdom.h3({
                className: "text-lg font-semibold mb-4",
                childrenType: "text",
                children: "🔧 数据控制"
              });

              fdom.div({
                className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                children() {
                  // 分类过滤
                  fdom.div({
                    children() {
                      fdom.label({
                        className() {
                          return `block text-sm font-medium ${colors.textSecondary} mb-2`;
                        },
                        childrenType: "text",
                        children: "分类过滤"
                      });

                      renderInput(filterCategory.get, filterCategory.set,
                        fdom.select({
                          className() {
                            return `w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.cardBg} ${colors.text}`;
                          },
                          children() {
                            const categories = ["all", "技术", "设计", "产品", "运营", "市场"];
                            categories.forEach(category => {
                              fdom.option({
                                value: category,
                                childrenType: "text",
                                children: category === "all" ? "全部" : category
                              });
                            });
                          }
                        }));
                    }
                  });

                  // 排序字段
                  fdom.div({
                    children() {
                      fdom.label({
                        className() {
                          return `block text-sm font-medium ${colors.textSecondary} mb-2`;
                        },
                        childrenType: "text",
                        children: "排序字段"
                      });

                      renderInput(sortBy.get, sortBy.set as SetValue<any>,
                        fdom.select({
                          className() {
                            return `w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.cardBg} ${colors.text}`;
                          },
                          children() {
                            const options = [
                              { value: "name", label: "名称" },
                              { value: "value", label: "数值" },
                              { value: "timestamp", label: "时间" }
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

                  // 排序方向
                  fdom.div({
                    children() {
                      fdom.label({
                        className() {
                          return `block text-sm font-medium ${colors.textSecondary} mb-2`;
                        },
                        childrenType: "text",
                        children: "排序方向"
                      });

                      renderInput(sortOrder.get, sortOrder.set as SetValue<any>,
                        fdom.select({
                          className() {
                            return `w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.cardBg} ${colors.text}`;
                          },
                          children() {
                            fdom.option({ value: "asc", childrenType: "text", children: "升序" });
                            fdom.option({ value: "desc", childrenType: "text", children: "降序" });
                          }
                        }));
                    }
                  });
                }
              });
            }
          });

          // 数据列表
          fdom.div({
            className() {
              return `${colors.cardBg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden`;
            },
            children() {
              fdom.div({
                className() {
                  return `p-4 ${colors.border} border-b`;
                },
                children() {
                  fdom.h3({
                    className: "text-lg font-semibold",
                    childrenType: "text",
                    children() {
                      return `📊 数据列表 (${filteredAndSortedItems().length})`;
                    }
                  });
                }
              });

              fdom.div({
                className: "max-h-96 overflow-y-auto",
                children() {
                  renderIf(
                    () => filteredAndSortedItems().length === 0,
                    () => {
                      fdom.div({
                        className: "p-8 text-center",
                        children() {
                          fdom.div({
                            className: "text-4xl mb-2 opacity-20",
                            childrenType: "text",
                            children: "📭"
                          });

                          fdom.p({
                            className() {
                              return colors.textSecondary;
                            },
                            childrenType: "text",
                            children: "暂无数据，请先生成测试数据"
                          });
                        }
                      });
                    },
                    () => {
                      renderArrayKey(
                        () => filteredAndSortedItems().slice(0, 20), // 只显示前20条
                        (item) => item.id,
                        (getItem) => {
                          const item = getItem();

                          fdom.div({
                            className() {
                              return `flex items-center justify-between p-4 ${colors.border} border-b last:border-b-0 ${colors.hover} transition-colors duration-150`;
                            },
                            children() {
                              fdom.div({
                                className: "flex items-center gap-3",
                                children() {
                                  // 状态指示器
                                  fdom.div({
                                    className() {
                                      return `w-3 h-3 rounded-full ${item.status === "active" ? "bg-green-500" : "bg-gray-400"
                                        }`;
                                    }
                                  });

                                  fdom.div({
                                    children() {
                                      fdom.div({
                                        className: "font-medium",
                                        childrenType: "text",
                                        children: item.name
                                      });

                                      fdom.div({
                                        className() {
                                          return `text-sm ${colors.textSecondary}`;
                                        },
                                        childrenType: "text",
                                        children: `${item.category} | ${item.timestamp.toLocaleDateString()}`
                                      });
                                    }
                                  });
                                }
                              });

                              fdom.div({
                                className: "text-right",
                                children() {
                                  fdom.div({
                                    className: "font-semibold text-purple-600",
                                    childrenType: "text",
                                    children: item.value.toString()
                                  });

                                  fdom.div({
                                    className() {
                                      return `text-xs ${colors.textSecondary}`;
                                    },
                                    childrenType: "text",
                                    children: item.status
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

    function NotificationsSection() {
      const colors = themeColors();

      fdom.div({
        className: "space-y-8",
        children() {
          fdom.div({
            className: "text-center mb-8",
            children() {
              fdom.h2({
                className: "text-2xl font-bold mb-4",
                childrenType: "text",
                children: "🔔 通知系统"
              });

              fdom.p({
                className() {
                  return `text-lg ${colors.textSecondary}`;
                },
                childrenType: "text",
                children: "全局通知管理、自动清理、类型化通知等功能"
              });
            }
          });

          // 通知测试按钮
          fdom.div({
            className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8",
            children() {
              const notificationTypes = [
                { type: "info", label: "信息", color: "bg-blue-500", icon: "ℹ️" },
                { type: "success", label: "成功", color: "bg-green-500", icon: "✅" },
                { type: "warning", label: "警告", color: "bg-yellow-500", icon: "⚠️" },
                { type: "error", label: "错误", color: "bg-red-500", icon: "❌" }
              ];

              notificationTypes.forEach(notif => {
                fdom.button({
                  onClick() {
                    addNotification({
                      type: notif.type as any,
                      title: `${notif.label}通知`,
                      message: `这是一个${notif.label}类型的通知消息`
                    });
                  },
                  className: `${notif.color} text-white p-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-2`,
                  children() {
                    fdom.span({
                      className: "text-2xl",
                      childrenType: "text",
                      children: notif.icon
                    });

                    fdom.span({
                      childrenType: "text",
                      children: notif.label
                    });
                  }
                });
              });
            }
          });

          // 通知历史
          fdom.div({
            className() {
              return `${colors.cardBg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden`;
            },
            children() {
              fdom.div({
                className() {
                  return `p-4 ${colors.border} border-b`;
                },
                children() {
                  fdom.h3({
                    className: "text-lg font-semibold",
                    childrenType: "text",
                    children: "📋 通知历史"
                  });
                }
              });

              fdom.div({
                className: "max-h-64 overflow-y-auto",
                children() {
                  renderIf(
                    () => getNotifications().length === 0,
                    () => {
                      fdom.div({
                        className: "p-8 text-center",
                        children() {
                          fdom.p({
                            className() {
                              return colors.textSecondary;
                            },
                            childrenType: "text",
                            children: "暂无通知记录"
                          });
                        }
                      });
                    },
                    () => {
                      renderArrayKey(
                        getNotifications,
                        (notification) => notification.id,
                        (getNotification) => {
                          const notification = getNotification();

                          fdom.div({
                            className() {
                              return `p-4 ${colors.border} border-b last:border-b-0`;
                            },
                            children() {
                              fdom.div({
                                className: "flex items-start gap-3",
                                children() {
                                  fdom.div({
                                    className() {
                                      const typeColors = {
                                        info: "bg-blue-100 text-blue-800",
                                        success: "bg-green-100 text-green-800",
                                        warning: "bg-yellow-100 text-yellow-800",
                                        error: "bg-red-100 text-red-800"
                                      };
                                      return `px-2 py-1 rounded-full text-xs font-medium ${typeColors[notification.type]}`;
                                    },
                                    childrenType: "text",
                                    children: notification.type
                                  });

                                  fdom.div({
                                    className: "flex-1",
                                    children() {
                                      fdom.h4({
                                        className: "font-medium mb-1",
                                        childrenType: "text",
                                        children: notification.title
                                      });

                                      fdom.p({
                                        className() {
                                          return `text-sm ${colors.textSecondary} mb-1`;
                                        },
                                        childrenType: "text",
                                        children: notification.message
                                      });

                                      fdom.p({
                                        className() {
                                          return `text-xs ${colors.textSecondary}`;
                                        },
                                        childrenType: "text",
                                        children: notification.timestamp.toLocaleString()
                                      });
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

  })
}


// 类型定义
interface DataItem {
  id: number;
  name: string;
  value: number;
  category: string;
  status: "active" | "inactive";
  timestamp: Date;
}

interface Notification {
  id: number;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  memoHits: number;
  memoMisses: number;
}
