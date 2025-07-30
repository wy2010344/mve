/**
 * 高级特性示例 - Context、性能优化、复杂状态管理、通知系统
 */

import { fdom } from "mve-dom";
import { createSignal, memo, addEffect } from "wy-helper";
import { BranchLoaderParam, renderOneKey, getBranchKey, hookDestroy } from "mve-helper";
import { routerConsume } from "mve-dom-helper/history";

import subHeader from "../sub-header";
import meta from "./meta";
import { gContext } from "../gContext";
import advancedContext from "./advanced-context";

interface DataItem {
  id: number;
  name: string;
  value: number;
  category: string;
  status: "active" | "inactive";
  timestamp: Date;
}

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  memoHits: number;
  memoMisses: number;
}

export default function (e: BranchLoaderParam) {
  subHeader(meta, function () {
    const { router, getHistoryState } = routerConsume()
    const { theme, themeColors, addNotification, renderBranch } = gContext.consume()

    // 数据状态
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
      const items = dataItems.get();
      const category = filterCategory.get();
      const sort = sortBy.get();
      const order = sortOrder.get();

      let filtered = items;
      if (category !== "all") {
        filtered = items.filter(item => item.category === category);
      }

      return [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sort) {
          case "name": comparison = a.name.localeCompare(b.name); break;
          case "value": comparison = a.value - b.value; break;
          case "timestamp": comparison = a.timestamp.getTime() - b.timestamp.getTime(); break;
        }
        return order === "asc" ? comparison : -comparison;
      });
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
        timestamp: new Date(Date.now() - Math.random() * 86400000 * 30)
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
    // 性能监控
    addEffect(() => {
      const start = performance.now();
      const metrics = performanceMetrics.get();
      performanceMetrics.set({
        ...metrics,
        renderCount: metrics.renderCount + 1
      });

      Promise.resolve().then(() => {
        const end = performance.now();
        const currentMetrics = performanceMetrics.get();
        performanceMetrics.set({
          ...currentMetrics,
          lastRenderTime: Math.round((end - start) * 100) / 100
        });
      });
    });

    addEffect(() => {
      const newTheme = theme();
      document.documentElement.setAttribute('data-theme', newTheme);
    });

    hookDestroy(() => {
      console.log('高级特性组件销毁');
    });

    // 提供 Context
    advancedContext.provide({
      dataItems,
      filterCategory,
      sortBy,
      sortOrder,
      performanceMetrics,
      filteredAndSortedItems,
      dataStatistics,
      generateTestData,
      clearData,
      performStressTest
    });

    // 主容器
    fdom.div({
      className() {
        const colors = themeColors();
        return `h-full ${colors.bg} ${colors.text} transition-colors duration-300`;
      },
      children() {
        // 顶部导航
        fdom.div({
          className() {
            const colors = themeColors();
            return `sticky top-0 z-10 ${colors.cardBg} backdrop-blur-sm border-b ${colors.border} p-6`;
          },
          children() {
            fdom.div({
              className: "max-w-7xl mx-auto",
              children() {
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
                          const url = e.getAbsolutePath(`./${section.id}`)
                          fdom.button({
                            onClick() {
                              router.replace(url);
                            },
                            className() {
                              const pathname = getHistoryState().pathname
                              const isActive = pathname.startsWith(url)

                              if (isActive) {
                                return "px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium shadow-lg transform scale-105";
                              }

                              const colors = themeColors();
                              return `px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${colors.cardBg} ${colors.border} border ${colors.hover}`;
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
            });
          }
        });

        // 内容区域
        fdom.div({
          className: "max-w-7xl mx-auto p-6",
          children() {
            renderOneKey(e.getChildren, getBranchKey, function (loader, get) {
              renderBranch(get)
            })
          }
        });
      }
    });
  })
}