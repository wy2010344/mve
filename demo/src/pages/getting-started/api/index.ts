import { fdom } from "mve-dom";
import { gContext } from "../../gContext";
import { renderArrayKey } from "mve-helper";
import { renderInputBool } from "mve-dom-helper";
import { createSignal } from "wy-helper";

export default function APISection() {
  const { theme } = gContext.consume()
  const isDark = theme() === "dark";

  // API 对比示例数据
  const items = createSignal([
    { id: 1, text: "学习 Signal", done: false },
    { id: 2, text: "掌握 memo", done: true },
    { id: 3, text: "理解 API 差异", done: false }
  ]);
  const toggleItem = (id: number) => {
    const updated = items.get().map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    items.set(updated);
  };
  fdom.div({
    className: "space-y-8",
    children() {
      fdom.div({
        className: "text-center mb-8",
        children() {
          fdom.h2({
            className: "text-2xl font-bold mb-4",
            childrenType: "text",
            children: "🎨 DOM API 对比"
          });

          fdom.p({
            className() {
              return `text-lg ${isDark ? "text-gray-300" : "text-gray-600"}`;
            },
            childrenType: "text",
            children: "MVE 提供三套 DOM API：dom（链式）、fdom（扁平）、adom（性能优化）"
          });
        }
      });

      // API 对比表格
      fdom.div({
        className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
        children() {
          const apis = [
            {
              name: "dom.xx",
              title: "链式调用",
              description: "jQuery 风格的链式 API",
              color: "blue",
              example: `dom.div({ className: "container" })
  .render(() => {
    dom.p()
      .renderTextContent("Hello");
  });`
            },
            {
              name: "fdom.xx",
              title: "扁平参数",
              description: "React 风格的扁平参数（推荐）",
              color: "green",
              example: `fdom.div({
  className: "container",
  children() {
    fdom.p({
      childrenType: "text",
      children: "Hello"
    });
  }
});`
            },
            {
              name: "mdom.xx",
              title: "性能优化",
              description: "高性能场景的优化 API",
              color: "purple",
              example: `mdom({
  attrs(m) {
    m.className = "container";
    if (isActive.get()) {
      m.s_color = "blue";
    }
  }
});`
            }
          ];

          apis.forEach(api => {
            fdom.div({
              className() {
                return `${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`;
              },
              children() {
                fdom.div({
                  className: "text-center mb-4",
                  children() {
                    fdom.h3({
                      className: `text-xl font-bold text-${api.color}-600 mb-2`,
                      childrenType: "text",
                      children: api.title
                    });

                    fdom.code({
                      className() {
                        return `px-2 py-1 rounded text-sm font-mono ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-800"}`;
                      },
                      childrenType: "text",
                      children: api.name
                    });

                    fdom.p({
                      className() {
                        return `mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`;
                      },
                      childrenType: "text",
                      children: api.description
                    });
                  }
                });

                fdom.pre({
                  className() {
                    return `${isDark ? "bg-gray-900 text-green-400" : "bg-gray-100 text-gray-800"} p-4 rounded-lg overflow-x-auto text-xs`;
                  },
                  childrenType: "text",
                  children: api.example
                });
              }
            });
          });
        }
      });

      // 实际演示
      fdom.div({
        className() {
          return `${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-6 shadow-lg`;
        },
        children() {
          fdom.h3({
            className: "text-xl font-semibold mb-4 text-center",
            childrenType: "text",
            children: "📝 实际演示 - 待办列表"
          });

          fdom.div({
            className: "space-y-3",
            children() {
              renderArrayKey(items.get, v => v.id, (getItem) => {
                fdom.div({
                  className() {
                    return `flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                      }`;
                  },
                  children() {
                    renderInputBool(() => getItem().done, (v) => toggleItem(getItem().id),
                      fdom.input({
                        type: "checkbox",
                        className: "w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      }));

                    fdom.span({
                      className() {
                        return `flex-1 ${getItem().done ? "line-through text-gray-500" : ""}`;
                      },
                      childrenType: "text",
                      children() {
                        return getItem().text
                      }
                    });

                    fdom.span({
                      className() {
                        return `text-xs px-2 py-1 rounded-full ${getItem().done
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`;
                      },
                      childrenType: "text",
                      children() {
                        return getItem().done ? "完成" : "待办"
                      }
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