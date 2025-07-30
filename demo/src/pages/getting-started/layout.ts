/**
 * 基础入门示例 - MVE 框架核心概念全面展示
 * 包含：Signal响应式、memo计算、DOM API对比、依赖追踪
 */

import { fdom, dom } from "mve-dom";
import { createSignal, memo, addEffect } from "wy-helper";
import { renderIf, renderOne, renderArray, hookTrackSignal, hookDestroy, renderArrayKey, LeafLoaderParam, BranchLoaderParam, renderOneKey, getBranchKey } from "mve-helper";
import { renderInputBool } from "mve-dom-helper";
import subHeader from "../sub-header";
import meta from "./meta";
import { gContext } from "../gContext";
import { routerConsume } from "mve-dom-helper/history";
import gettingStartedContext from "./getting-started-context";

export default function (e: BranchLoaderParam) {
  subHeader(meta, function () {
    const { router, getHistoryState } = routerConsume()
    const { theme, renderBranch } = gContext.consume()
    // 当前展示的部分
    // const currentSection = createSignal<"signal" | "memo" | "api" | "tracking">("signal");
    // Signal 基础示例
    const count = createSignal(0);
    const name = createSignal("MVE");


    // 追踪示例
    const trackingLog = createSignal<string[]>([]);

    // 副作用处理 - 使用 addEffect 而不是 hookTrackSignal
    addEffect(() => {
      const currentCount = count.get();
      const log = `计数变化: ${currentCount} (${new Date().toLocaleTimeString()})`;
      trackingLog.set([log, ...trackingLog.get().slice(0, 4)]);

      if (currentCount === 10) {
        alert('🎉 恭喜！计数达到 10');
      }
    });

    addEffect(() => {
      const currentName = name.get();
      const log = `名称变化: "${currentName}" (${new Date().toLocaleTimeString()})`;
      trackingLog.set([log, ...trackingLog.get().slice(0, 4)]);
    });

    // 生命周期
    hookDestroy(() => {
      console.log('基础入门组件销毁');
    });


    gettingStartedContext.provide({
      name,
      count,
      trackingLog
    })
    // 主容器
    fdom.div({
      className() {
        const isDark = theme() === "dark";
        return `h-full transition-colors duration-300 ${isDark ? "bg-gray-900 text-white" : "bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900"
          }`;
      },
      children() {
        // 顶部导航
        fdom.div({
          className() {
            const isDark = theme() === "dark";
            return `sticky top-0 z-10 ${isDark ? "bg-gray-800" : "bg-white/90"} backdrop-blur-sm border-b ${isDark ? "border-gray-700" : "border-gray-200"} p-6`;
          },
          children() {
            fdom.div({
              className: "max-w-6xl mx-auto flex items-center justify-between",
              children() {
                fdom.h1({
                  className: "text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent",
                  childrenType: "text",
                  children: "🚀 MVE 基础入门"
                });
              }
            });
          }
        });

        fdom.div({
          className: "max-w-6xl mx-auto p-6",
          children() {
            // 导航标签
            fdom.div({
              className: "flex flex-wrap gap-2 mb-8 justify-center",
              children() {
                const sections = [
                  { id: "signal", label: "Signal 响应式", icon: "🔧" },
                  { id: "memo", label: "memo 计算", icon: "⚡" },
                  { id: "api", label: "API 对比", icon: "🎨" },
                  { id: "tracking", label: "依赖追踪", icon: "👀" }
                ];

                sections.forEach(section => {
                  const url = e.getAbsolutePath(`./${section.id}`)
                  fdom.button({
                    onClick() {
                      router.push(url)
                      // currentSection.set(section.id as any);
                    },
                    className() {
                      const pathname = getHistoryState().pathname
                      const isActive = pathname.startsWith(url)
                      const isDark = theme() === "dark";

                      if (isActive) {
                        return "px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium shadow-lg transform scale-105";
                      }

                      return `px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${isDark
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-white hover:bg-gray-50 text-gray-700 shadow-md"
                        }`;
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

            // 内容区域
            renderOneKey(e.getChildren, getBranchKey, function (loader, get) {
              renderBranch(get)
            })
          }
        });
      }
    });

  }
  )
}