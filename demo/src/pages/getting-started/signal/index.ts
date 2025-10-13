import { fdom } from 'mve-dom';
import { gContext } from '../../gContext';
import { memo } from 'wy-helper';
import gettingStartedContext from '../getting-started-context';

export default function () {
  const { name, count } = gettingStartedContext.consume();

  // 操作函数
  const increment = () => count.set(count.get() + 1);
  const decrement = () => count.set(count.get() - 1);
  const reset = () => count.set(0);

  const { theme } = gContext.consume();
  // memo 计算属性示例
  const displayText = memo((old: any, inited: boolean) => {
    console.log('🔄 displayText 计算', { old, inited });
    return `${name.get()}: ${count.get()}`;
  });

  const countStatus = memo((old: any, inited: boolean) => {
    const value = count.get();
    if (value === 0) return { text: '起始状态', color: 'gray' };
    if (value > 0) return { text: '正数', color: 'green' };
    return { text: '负数', color: 'red' };
  });
  const isDark = theme() === 'dark';

  fdom.div({
    className: 'space-y-8',
    children() {
      // 标题
      fdom.div({
        className: 'text-center mb-8',
        children() {
          fdom.h2({
            className: 'text-2xl font-bold mb-4',
            childrenType: 'text',
            children: '🔧 Signal 响应式状态',
          });

          fdom.p({
            className() {
              return `text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
            },
            childrenType: 'text',
            children: 'Signal 是 MVE 的核心，提供原子性的响应式状态管理',
          });
        },
      });

      // 演示区域
      fdom.div({
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
        children() {
          // 左侧：交互区域
          fdom.div({
            className() {
              return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-6 text-center',
                childrenType: 'text',
                children: '🎮 交互演示',
              });

              // 显示区域
              fdom.div({
                className() {
                  return `text-center p-6 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`;
                },
                children() {
                  fdom.div({
                    className: 'text-4xl font-bold mb-2',
                    childrenType: 'text',
                    children() {
                      return displayText();
                    },
                  });

                  fdom.div({
                    className() {
                      const status = countStatus();
                      const colorClass = {
                        gray: 'text-gray-500',
                        green: 'text-green-500',
                        red: 'text-red-500',
                      }[status.color];
                      return `text-lg ${colorClass}`;
                    },
                    childrenType: 'text',
                    children() {
                      return `状态: ${countStatus().text}`;
                    },
                  });
                },
              });

              // 控制按钮
              fdom.div({
                className: 'flex gap-3 justify-center mb-6',
                children() {
                  fdom.button({
                    onClick: decrement,
                    className:
                      'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200',
                    childrenType: 'text',
                    children: '➖',
                  });

                  fdom.button({
                    onClick: reset,
                    className() {
                      return `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        isDark
                          ? 'bg-gray-600 hover:bg-gray-500 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`;
                    },
                    childrenType: 'text',
                    children: '🔄',
                  });

                  fdom.button({
                    onClick: increment,
                    className:
                      'px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200',
                    childrenType: 'text',
                    children: '➕',
                  });
                },
              });

              // 名称输入
              fdom.div({
                className: 'text-center',
                children() {
                  fdom.label({
                    className() {
                      return `block mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`;
                    },
                    childrenType: 'text',
                    children: '✏️ 修改名称:',
                  });

                  fdom.input({
                    type: 'text',
                    value() {
                      return name.get();
                    },
                    onInput(e: any) {
                      const target = e.target as HTMLInputElement;
                      name.set(target.value);
                    },
                    className() {
                      return `px-4 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`;
                    },
                  });
                },
              });
            },
          });

          // 右侧：代码示例
          fdom.div({
            className() {
              return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-4',
                childrenType: 'text',
                children: '💻 代码示例',
              });

              fdom.pre({
                className() {
                  return `${isDark ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-gray-800'} p-4 rounded-lg overflow-x-auto text-sm`;
                },
                childrenType: 'text',
                children: `// 创建 Signal
const count = createSignal(0);
const name = createSignal("MVE");

// 读取值
console.log(count.get()); // 0

// 设置值
count.set(5);
name.set("新名称");

// 响应式更新
// 当 Signal 值改变时，
// 依赖它的 UI 会自动更新`,
              });
            },
          });
        },
      });
    },
  });
}
