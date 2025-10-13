import { fdom } from 'mve-dom';
import { gContext } from '../../gContext';
import gettingStartedContext from '../getting-started-context';
import { memo } from 'wy-helper';

export default function MemoSection() {
  const { name, count } = gettingStartedContext.consume();
  const { theme } = gContext.consume();
  const isDark = theme() === 'dark';
  const expensiveCalc = memo((old: any, inited: boolean) => {
    console.log('💰 昂贵计算执行', { old, inited });
    // 模拟复杂计算
    let result = 0;
    for (let i = 0; i < count.get() * 1000; i++) {
      result += Math.random();
    }
    return Math.round(result);
  });

  fdom.div({
    className: 'space-y-8',
    children() {
      fdom.div({
        className: 'text-center mb-8',
        children() {
          fdom.h2({
            className: 'text-2xl font-bold mb-4',
            childrenType: 'text',
            children: '⚡ memo 智能计算',
          });

          fdom.p({
            className() {
              return `text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
            },
            childrenType: 'text',
            children:
              'memo 提供智能缓存，只在依赖变化时重新计算，避免不必要的性能开销',
          });
        },
      });

      fdom.div({
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
        children() {
          // 左侧：演示
          fdom.div({
            className() {
              return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-6 text-center',
                childrenType: 'text',
                children: '🧮 计算演示',
              });

              // 当前值显示
              fdom.div({
                className() {
                  return `text-center p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`;
                },
                children() {
                  fdom.div({
                    className: 'text-2xl font-bold mb-2',
                    childrenType: 'text',
                    children() {
                      return `计数: ${count.get()}`;
                    },
                  });

                  fdom.div({
                    className: 'text-lg text-purple-600 font-semibold',
                    childrenType: 'text',
                    children() {
                      return `复杂计算结果: ${expensiveCalc()}`;
                    },
                  });
                },
              });

              // 控制按钮
              fdom.div({
                className: 'flex gap-3 justify-center mb-4',
                children() {
                  fdom.button({
                    onClick: () => count.set(count.get() - 1),
                    className:
                      'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg',
                    childrenType: 'text',
                    children: '减少',
                  });

                  fdom.button({
                    onClick: () => count.set(0),
                    className:
                      'px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg',
                    childrenType: 'text',
                    children: '重置',
                  });

                  fdom.button({
                    onClick: () => count.set(count.get() + 1),
                    className:
                      'px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg',
                    childrenType: 'text',
                    children: '增加',
                  });
                },
              });

              fdom.div({
                className() {
                  return `text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center`;
                },
                childrenType: 'text',
                children: '💡 打开控制台查看 memo 计算日志',
              });
            },
          });

          // 右侧：代码
          fdom.div({
            className() {
              return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-4',
                childrenType: 'text',
                children: '💻 memo 用法',
              });

              fdom.pre({
                className() {
                  return `${isDark ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-gray-800'} p-4 rounded-lg overflow-x-auto text-sm`;
                },
                childrenType: 'text',
                children: `// memo 智能计算
const expensiveCalc = memo((old, inited) => {
  console.log('计算执行', { old, inited });
  
  // 复杂计算逻辑
  let result = 0;
  for (let i = 0; i < count.get() * 1000; i++) {
    result += Math.random();
  }
  return Math.round(result);
});

// 只有当 count 变化时才重新计算
// 多次调用 expensiveCalc() 会使用缓存`,
              });
            },
          });
        },
      });
    },
  });
}
