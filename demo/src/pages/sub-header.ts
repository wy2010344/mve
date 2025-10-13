import { fdom } from 'mve-dom';
import { routerConsume } from 'mve-dom-helper/history';
import { EmptyFun } from 'wy-helper';
import { gContext } from './gContext';
import { renderIf } from 'mve-helper';

export default function (
  selectedDemo: {
    href: string;
    title: string;
    description: string;
    difficulty: '入门' | '实战' | '高级';
    features: readonly string[];
    icon: string;
    color: string;
  },
  children: EmptyFun
) {
  const { backOrReplace } = routerConsume();
  const { theme, toggleTheme, themeColors, addNotification, getNotifications } =
    gContext.consume();
  fdom.div({
    className: 'flex flex-col h-screen',
    children() {
      // 顶部导航栏
      fdom.div({
        className:
          'sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm',
        children() {
          fdom.div({
            className:
              'max-w-7xl mx-auto px-6 py-4 flex items-center justify-between',
            children() {
              fdom.button({
                onClick() {
                  backOrReplace('/');
                },
                className:
                  'inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 hover:scale-105',
                children() {
                  fdom.span({
                    className: 'text-lg',
                    childrenType: 'text',
                    children: '←',
                  });

                  fdom.span({
                    className: 'font-medium',
                    childrenType: 'text',
                    children: '返回首页',
                  });
                },
              });

              fdom.div({
                className: 'flex items-center gap-3',
                children() {
                  fdom.span({
                    className: 'text-2xl',
                    childrenType: 'text',
                    children: selectedDemo.icon,
                  });

                  fdom.div({
                    children() {
                      fdom.div({
                        className: 'flex items-center gap-3',
                        children() {
                          fdom.h1({
                            className: 'text-xl font-bold text-gray-900',
                            childrenType: 'text',
                            children: selectedDemo.title,
                          });
                          fdom.span({
                            className() {
                              const colors = {
                                入门: 'bg-green-100 text-green-800',
                                实战: 'bg-blue-100 text-blue-800',
                                高级: 'bg-purple-100 text-purple-800',
                              };
                              return `px-3 py-1 rounded-full text-sm font-semibold ${colors[selectedDemo.difficulty]}`;
                            },
                            childrenType: 'text',
                            children: selectedDemo.difficulty,
                          });
                        },
                      });
                      fdom.p({
                        className: 'text-sm text-gray-600',
                        childrenType: 'text',
                        children: selectedDemo.description,
                      });
                    },
                  });
                },
              });

              fdom.div({
                className: 'flex items-center gap-4',
                children() {
                  fdom.button({
                    onClick: toggleTheme,
                    className() {
                      const colors = themeColors();
                      return `p-2 rounded-lg ${colors.hover} transition-colors duration-200`;
                    },
                    children() {
                      fdom.span({
                        className: 'text-xl',
                        childrenType: 'text',
                        children() {
                          return theme() === 'dark' ? '☀️' : '🌙';
                        },
                      });
                    },
                  });

                  // 通知按钮
                  fdom.button({
                    onClick() {
                      addNotification({
                        type: 'info',
                        title: '测试通知',
                        message: '这是一个测试通知消息',
                      });
                    },
                    className() {
                      const colors = themeColors();
                      return `relative p-2 rounded-lg ${colors.hover} transition-colors duration-200`;
                    },
                    children() {
                      fdom.span({
                        className: 'text-xl',
                        childrenType: 'text',
                        children: '🔔',
                      });

                      renderIf(
                        () => getNotifications().length > 0,
                        () => {
                          fdom.span({
                            className:
                              'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center',
                            childrenType: 'text',
                            children() {
                              return Math.min(
                                getNotifications().length,
                                9
                              ).toString();
                            },
                          });
                        }
                      );
                    },
                  });
                },
              });
            },
          });
        },
      });

      // 示例内容
      fdom.div({
        className: 'flex-1 min-h-0',
        children,
      });
    },
  });
}
