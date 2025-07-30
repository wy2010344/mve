import { fdom } from "mve-dom";
import { gContext } from "../../gContext";
import advancedContext from "../advanced-context";

export default function () {
  const { theme, themeColors, toggleTheme, addNotification } = gContext.consume();
  const { performanceMetrics } = advancedContext.consume();

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
              return `text-lg ${themeColors().textSecondary}`;
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
              return `${themeColors().cardBg} ${themeColors().border} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: "text-xl font-semibold mb-4",
                childrenType: "text",
                children: "💻 Context 用法"
              });

              fdom.pre({
                className() {
                  return `${themeColors().bg} p-4 rounded-lg overflow-x-auto text-sm`;
                },
                childrenType: "text",
                children: `// 1. 创建 Context
const AppContext = createContext<{
  theme: () => "light" | "dark";
  toggleTheme: () => void;
}>();

// 2. 提供 Context - 基于调用栈
AppContext.provide(contextValue);
funA(); // 内部 consume() 得到 contextValue

AppContext.provide(anotherValue);  
funB(); // 内部 consume() 得到 anotherValue

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

  function ContextDemo() {
    fdom.div({
      className() {
        return `${themeColors().cardBg} ${themeColors().border} border rounded-2xl p-6 shadow-lg`;
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
            return `p-4 rounded-xl mb-4 ${themeColors().bg}`;
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
                const colors = themeColors();
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
    fdom.div({
      className() {
        const colors = themeColors();
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
            const colors = themeColors();
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
}