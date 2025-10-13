import { fdom } from 'mve-dom';
import { gContext } from '../../gContext';
import { renderArray, renderIf } from 'mve-helper';
import gettingStartedContext from '../getting-started-context';

export default function () {
  const { count, name, trackingLog } = gettingStartedContext.consume();
  const { theme } = gContext.consume();

  fdom.div({
    className: 'space-y-8',
    children() {
      fdom.div({
        className: 'text-center mb-8',
        children() {
          fdom.h2({
            className: 'text-2xl font-bold mb-4',
            childrenType: 'text',
            children: '👀 依赖追踪',
          });

          fdom.p({
            className() {
              const isDark = theme() === 'dark';
              return `text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`;
            },
            childrenType: 'text',
            children: 'hookTrackSignal 可以监听 Signal 变化，执行副作用操作',
          });
        },
      });

      fdom.div({
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
        children() {
          // 左侧：控制区域
          fdom.div({
            className() {
              const isDark = theme() === 'dark';
              return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-6 text-center',
                childrenType: 'text',
                children: '🎮 触发变化',
              });

              // 当前状态
              fdom.div({
                className() {
                  const isDark = theme() === 'dark';
                  return `text-center p-4 rounded-xl mb-6 ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`;
                },
                children() {
                  fdom.div({
                    className: 'text-2xl font-bold mb-2',
                    childrenType: 'text',
                    children() {
                      return `${name.get()}: ${count.get()}`;
                    },
                  });
                },
              });

              // 控制按钮
              fdom.div({
                className: 'space-y-4',
                children() {
                  fdom.div({
                    className: 'flex gap-3 justify-center',
                    children() {
                      fdom.button({
                        onClick: () => count.set(count.get() - 1),
                        className:
                          'px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg',
                        childrenType: 'text',
                        children: '计数 -1',
                      });

                      fdom.button({
                        onClick: () => count.set(count.get() + 1),
                        className:
                          'px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg',
                        childrenType: 'text',
                        children: '计数 +1',
                      });
                    },
                  });

                  fdom.div({
                    className: 'text-center',
                    children() {
                      fdom.input({
                        type: 'text',
                        value() {
                          return name.get();
                        },
                        onInput(e: any) {
                          const target = e.target as HTMLInputElement;
                          name.set(target.value);
                        },
                        placeholder: '修改名称',
                        className() {
                          const isDark = theme() === 'dark';
                          return `px-4 py-2 border rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            },
          });

          // 右侧：追踪日志
          fdom.div({
            className() {
              const isDark = theme() === 'dark';
              return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-4',
                childrenType: 'text',
                children: '📋 变化日志',
              });

              fdom.div({
                className() {
                  const isDark = theme() === 'dark';
                  return `${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-4 h-64 overflow-y-auto`;
                },
                children() {
                  renderIf(
                    () => trackingLog.get().length === 0,
                    () => {
                      fdom.div({
                        className() {
                          const isDark = theme() === 'dark';
                          return `text-center ${isDark ? 'text-gray-500' : 'text-gray-400'} py-8`;
                        },
                        childrenType: 'text',
                        children: '暂无变化记录，试试修改上面的值',
                      });
                    },
                    () => {
                      fdom.div({
                        className: 'space-y-2',
                        children() {
                          renderArray(
                            () => trackingLog.get(),
                            (log, getIndex) => {
                              fdom.div({
                                className() {
                                  const isDark = theme() === 'dark';
                                  return `text-sm p-2 rounded ${isDark ? 'bg-gray-800 text-green-400' : 'bg-white text-gray-700'} border-l-4 border-blue-500`;
                                },
                                childrenType: 'text',
                                children: log,
                              });
                            }
                          );
                        },
                      });
                    }
                  );
                },
              });

              fdom.div({
                className: 'mt-4',
                children() {
                  fdom.pre({
                    className() {
                      const isDark = theme() === 'dark';
                      return `${isDark ? 'bg-gray-900 text-green-400' : 'bg-gray-100 text-gray-800'} p-3 rounded-lg text-xs`;
                    },
                    childrenType: 'text',
                    children: `// 依赖追踪示例
hookTrackSignal(() => count.get(), (newValue) => {
  console.log('计数变化:', newValue);
  
  addEffect(() => {
    if (newValue === 10) {
      alert('达到目标值！');
    }
  }, 1);
});`,
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}
