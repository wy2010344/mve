import { fdom } from "mve-dom";
import { gContext } from "../../gContext";
import advancedContext from "../advanced-context";

export default function () {
  const { themeColors } = gContext.consume();
  const { performanceMetrics, generateTestData, performStressTest, clearData } = advancedContext.consume();

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
              return `text-lg ${themeColors().textSecondary}`;
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
                return `${themeColors().cardBg} ${themeColors().border} border rounded-2xl p-6 shadow-lg text-center`;
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
                    return `text-sm ${themeColors().textSecondary}`;
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
              return `px-6 py-3 rounded-lg font-medium transition-all duration-200 ${themeColors().border} border ${themeColors().hover}`;
            },
            childrenType: "text",
            children: "🗑️ 清空数据"
          });
        }
      });

      // 性能优化说明
      fdom.div({
        className() {
          return `${themeColors().cardBg} ${themeColors().border} border rounded-2xl p-6 shadow-lg`;
        },
        children() {
          fdom.h3({
            className: "text-xl font-semibold mb-4",
            childrenType: "text",
            children: "📈 性能优化技巧"
          });

          fdom.div({
            className: "space-y-4",
            children() {
              const tips = [
                {
                  title: "使用 memo 缓存计算",
                  desc: "对于复杂计算，使用 memo 避免重复计算",
                  code: "const result = memo(() => expensiveCalculation());"
                },
                {
                  title: "避免不必要的依赖",
                  desc: "确保 memo 只依赖真正需要的 Signal",
                  code: "const filtered = memo(() => items.filter(predicate));"
                },
                {
                  title: "批量状态更新",
                  desc: "使用 addEffect 批量处理状态更新",
                  code: "addEffect(() => { /* 批量更新 */ });"
                }
              ];

              tips.forEach(tip => {
                fdom.div({
                  className() {
                    return `p-4 rounded-lg ${themeColors().bg} border-l-4 border-blue-500`;
                  },
                  children() {
                    fdom.h4({
                      className: "font-semibold mb-2",
                      childrenType: "text",
                      children: tip.title
                    });

                    fdom.p({
                      className() {
                        return `text-sm ${themeColors().textSecondary} mb-2`;
                      },
                      childrenType: "text",
                      children: tip.desc
                    });

                    fdom.code({
                      className() {
                        return `text-xs ${themeColors().bg} p-2 rounded font-mono`;
                      },
                      childrenType: "text",
                      children: tip.code
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