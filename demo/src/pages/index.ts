/**
 * MVE 框架精炼示例系统
 * 3个核心示例，循序渐进展示框架特性
 */

import { fdom } from "mve-dom";
import { renderArray, renderOne } from "mve-helper";
import { createSignal } from "wy-helper";

import gettingStartedMeta from './getting-started/meta'
import comprehensiveMeta from './comprehensive/meta'
import advancedMeta from './advanced/meta'
import { routerConsume } from "mve-dom-helper/history";

const demos = [
  gettingStartedMeta,
  comprehensiveMeta,
  advancedMeta
];

export default function MVEDemoIndex() {

  const { router } = routerConsume()
  // 显示首页
  fdom.div({
    className: "container mx-auto px-6 py-12",
    children() {
      // 标题区域
      fdom.div({
        className: "text-center mb-16",
        children() {
          fdom.div({
            className: "inline-flex items-center gap-3 mb-6",
            children() {
              fdom.div({
                className: "w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg",
                childrenType: "text",
                children: "⚡"
              });

              fdom.h1({
                className: "text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent",
                childrenType: "text",
                children: "MVE 框架"
              });
            }
          });

          fdom.p({
            className: "text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8",
            childrenType: "text",
            children: "现代化响应式 Web 框架，通过 Signal 驱动的精确更新和智能缓存，提供卓越的开发体验和运行性能"
          });

          fdom.div({
            className: "flex flex-wrap justify-center gap-4 text-sm text-gray-500",
            children() {
              const highlights = ["🎯 精确更新", "⚡ 高性能", "🛠️ 类型安全", "📱 移动优先"];
              highlights.forEach(highlight => {
                fdom.span({
                  className: "px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200",
                  childrenType: "text",
                  children: highlight
                });
              });
            }
          });
        }
      });

      // 示例卡片
      fdom.div({
        className: "grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto",
        children() {
          renderArray(() => demos, (demo, getIndex) => {
            fdom.div({
              className: "group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-gray-200 cursor-pointer transform hover:-translate-y-3 hover:scale-105",
              onClick() {
                router.push(`/` + demo.href)
              },
              children() {
                // 渐变背景
                fdom.div({
                  className: `absolute inset-0 bg-gradient-to-br ${demo.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`
                });

                // 装饰性元素
                fdom.div({
                  className: "absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"
                });

                fdom.div({
                  className: "relative p-8",
                  children() {
                    // 顶部：图标和难度
                    fdom.div({
                      className: "flex items-center justify-between mb-6",
                      children() {
                        fdom.div({
                          className: `w-16 h-16 bg-gradient-to-br ${demo.color} rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`,
                          childrenType: "text",
                          children: demo.icon
                        });

                        fdom.span({
                          className() {
                            const colors = {
                              "入门": "bg-green-100 text-green-800 border-green-200",
                              "实战": "bg-blue-100 text-blue-800 border-blue-200",
                              "高级": "bg-purple-100 text-purple-800 border-purple-200"
                            };
                            return `px-3 py-1 rounded-full text-xs font-bold border ${colors[demo.difficulty]}`;
                          },
                          childrenType: "text",
                          children: demo.difficulty
                        });
                      }
                    });

                    // 标题和描述
                    fdom.div({
                      className: "mb-6",
                      children() {
                        fdom.h3({
                          className: "text-2xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300",
                          childrenType: "text",
                          children: demo.title
                        });

                        fdom.p({
                          className: "text-gray-600 leading-relaxed",
                          childrenType: "text",
                          children: demo.description
                        });
                      }
                    });

                    // 特性标签
                    fdom.div({
                      className: "mb-8",
                      children() {
                        fdom.div({
                          className: "text-sm font-semibold text-gray-700 mb-3",
                          childrenType: "text",
                          children: "核心特性"
                        });

                        fdom.div({
                          className: "grid grid-cols-2 gap-2",
                          children() {
                            renderArray(() => demo.features, (feature) => {
                              fdom.div({
                                className: "px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium transition-colors duration-200 text-center",
                                childrenType: "text",
                                children: feature
                              });
                            });
                          }
                        });
                      }
                    });

                    // 底部：查看按钮
                    fdom.div({
                      className: "pt-6 border-t border-gray-100",
                      children() {
                        fdom.div({
                          className: `flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 bg-gradient-to-r ${demo.color} rounded-xl group-hover:shadow-lg transition-all duration-300`,
                          children() {
                            fdom.span({
                              childrenType: "text",
                              children: "开始体验"
                            });

                            fdom.span({
                              className: "transform group-hover:translate-x-1 transition-transform duration-300",
                              childrenType: "text",
                              children: "→"
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          });
        }
      });

      // 底部学习路径
      fdom.div({
        className: "mt-20 text-center",
        children() {
          fdom.div({
            className: "bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-lg max-w-4xl mx-auto",
            children() {
              fdom.h3({
                className: "text-2xl font-bold text-gray-900 mb-6",
                childrenType: "text",
                children: "🎯 推荐学习路径"
              });

              fdom.div({
                className: "flex flex-col md:flex-row items-center justify-center gap-6",
                children() {
                  const steps = [
                    { icon: "🚀", title: "基础入门", desc: "掌握核心概念" },
                    { icon: "🎯", title: "实战应用", desc: "完整项目实践" },
                    { icon: "⚡", title: "高级特性", desc: "性能优化技巧" }
                  ];

                  steps.forEach((step, index) => {
                    fdom.div({
                      className: "flex items-center gap-4",
                      children() {
                        fdom.div({
                          className: "flex flex-col items-center text-center",
                          children() {
                            fdom.div({
                              className: "w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg mb-2 shadow-lg",
                              childrenType: "text",
                              children: step.icon
                            });

                            fdom.h4({
                              className: "font-semibold text-gray-900 mb-1",
                              childrenType: "text",
                              children: step.title
                            });

                            fdom.p({
                              className: "text-sm text-gray-600",
                              childrenType: "text",
                              children: step.desc
                            });
                          }
                        });

                        // 箭头（除了最后一个）
                        if (index < steps.length - 1) {
                          fdom.div({
                            className: "hidden md:block text-2xl text-gray-300 mx-4",
                            childrenType: "text",
                            children: "→"
                          });
                        }
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
}