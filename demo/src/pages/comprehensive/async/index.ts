import { fdom } from 'mve-dom';
import { renderIf, renderOne } from 'mve-helper';
import { gContext } from '../../gContext';
import comprehensiveContext from '../comprehensive-context';

export default function () {
  const { themeColors } = gContext.consume();
  const { getUserData, userLoading, getTasksData, tasksLoading } =
    comprehensiveContext.consume();

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
            children: '🔄 异步数据处理',
          });

          fdom.p({
            className() {
              const colors = themeColors();
              return `text-lg ${colors.textSecondary}`;
            },
            childrenType: 'text',
            children:
              'hookPromiseSignal 的正确使用方式，直接在属性中使用 get 函数',
          });
        },
      });

      fdom.div({
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
        children() {
          // 用户数据加载演示
          fdom.div({
            className() {
              const colors = themeColors();
              return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-6',
                childrenType: 'text',
                children: '👤 用户数据加载',
              });

              fdom.div({
                className() {
                  const colors = themeColors();
                  return `p-4 rounded-xl mb-4 ${colors.bg}`;
                },
                children() {
                  renderIf(userLoading, () => {
                    fdom.div({
                      className: 'text-center py-4',
                      children() {
                        fdom.div({
                          className:
                            'animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2',
                        });
                        fdom.p({
                          childrenType: 'text',
                          children: '加载用户数据中...',
                        });
                      },
                    });
                  });

                  renderOne(getUserData, function (result) {
                    if (result?.type === 'success') {
                      const user = result.value;
                      fdom.div({
                        className: 'text-center',
                        children() {
                          fdom.div({
                            className:
                              'w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl text-white',
                            childrenType: 'text',
                            children: user.avatar,
                          });

                          fdom.h4({
                            className: 'text-lg font-semibold mb-1',
                            childrenType: 'text',
                            children: user.name,
                          });

                          fdom.p({
                            className() {
                              const colors = themeColors();
                              return `text-sm ${colors.textSecondary}`;
                            },
                            childrenType: 'text',
                            children: user.email,
                          });
                        },
                      });
                    } else if (result?.type === 'error') {
                      fdom.div({
                        className: 'text-center text-red-500',
                        childrenType: 'text',
                        children: '加载失败',
                      });
                    } else if (!result) {
                      fdom.div({
                        className: 'text-center text-gray-500',
                        childrenType: 'text',
                        children: '暂无数据',
                      });
                    }
                  });
                },
              });

              // 代码示例
              fdom.div({
                children() {
                  fdom.h4({
                    className: 'text-sm font-semibold mb-2',
                    childrenType: 'text',
                    children: '💻 代码示例',
                  });

                  fdom.pre({
                    className() {
                      const colors = themeColors();
                      return `${colors.bg} p-3 rounded-lg text-xs overflow-x-auto`;
                    },
                    childrenType: 'text',
                    children: `// hookPromiseSignal 正确用法
const { get: getUserData, loading } = hookPromiseSignal(() => {
  return () => fetchUser();
});

// 直接在属性中使用
fdom.div({
  s_color() {
    const result = getUserData();
    if (result?.type === 'success') {
      return 'green';
    }
    return 'gray';
  }
});`,
                  });
                },
              });
            },
          });

          // 任务数据加载演示
          fdom.div({
            className() {
              const colors = themeColors();
              return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: 'text-xl font-semibold mb-6',
                childrenType: 'text',
                children: '📋 任务数据加载',
              });

              fdom.div({
                className() {
                  const colors = themeColors();
                  return `p-4 rounded-xl mb-4 ${colors.bg}`;
                },
                children() {
                  renderIf(tasksLoading, () => {
                    fdom.div({
                      className: 'text-center py-4',
                      children() {
                        fdom.div({
                          className:
                            'animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2',
                        });
                        fdom.p({
                          childrenType: 'text',
                          children: '加载任务数据中...',
                        });
                      },
                    });
                  });

                  renderOne(getTasksData, function (result) {
                    if (result?.type === 'success') {
                      const tasks = result.value;
                      fdom.div({
                        children() {
                          fdom.h4({
                            className: 'font-semibold mb-3',
                            childrenType: 'text',
                            children: `📊 加载了 ${tasks.length} 个任务`,
                          });

                          fdom.div({
                            className: 'space-y-2',
                            children() {
                              tasks.slice(0, 3).forEach((task: any) => {
                                fdom.div({
                                  className: 'flex items-center gap-2 text-sm',
                                  children() {
                                    fdom.div({
                                      className() {
                                        const statusColors = {
                                          todo: 'bg-yellow-500',
                                          doing: 'bg-purple-500',
                                          done: 'bg-green-500',
                                        };
                                        return `w-2 h-2 rounded-full ${statusColors[task.status as keyof typeof statusColors]}`;
                                      },
                                    });

                                    fdom.span({
                                      childrenType: 'text',
                                      children: task.title,
                                    });
                                  },
                                });
                              });
                            },
                          });
                        },
                      });
                    } else if (result?.type === 'error') {
                      fdom.div({
                        className: 'text-center text-red-500',
                        childrenType: 'text',
                        children: '加载失败',
                      });
                    } else if (!result) {
                      fdom.div({
                        className: 'text-center text-gray-500',
                        childrenType: 'text',
                        children: '暂无数据',
                      });
                    }
                  });
                },
              });

              // 状态说明
              fdom.div({
                children() {
                  fdom.h4({
                    className: 'text-sm font-semibold mb-2',
                    childrenType: 'text',
                    children: '📝 状态说明',
                  });

                  fdom.div({
                    className: 'text-xs space-y-1',
                    children() {
                      const states = [
                        { label: 'loading', desc: '数据加载中', color: 'blue' },
                        { label: 'success', desc: '加载成功', color: 'green' },
                        { label: 'error', desc: '加载失败', color: 'red' },
                        { label: 'null', desc: '暂无数据', color: 'gray' },
                      ];

                      states.forEach(state => {
                        fdom.div({
                          className: 'flex items-center gap-2',
                          children() {
                            fdom.div({
                              className: `w-2 h-2 rounded-full bg-${state.color}-500`,
                            });

                            fdom.span({
                              className: 'font-mono',
                              childrenType: 'text',
                              children: state.label,
                            });

                            fdom.span({
                              className() {
                                const colors = themeColors();
                                return colors.textSecondary;
                              },
                              childrenType: 'text',
                              children: ` - ${state.desc}`,
                            });
                          },
                        });
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });

      // 最佳实践说明
      fdom.div({
        className() {
          const colors = themeColors();
          return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
        },
        children() {
          fdom.h3({
            className: 'text-xl font-semibold mb-4',
            childrenType: 'text',
            children: '✨ 最佳实践',
          });

          fdom.div({
            className: 'space-y-4',
            children() {
              const practices = [
                {
                  title: '直接在属性中使用',
                  desc: 'hookPromiseSignal 的 get 函数可以直接在 DOM 属性中使用，无需通过 hookTrackSignal 同步',
                  icon: '✅',
                },
                {
                  title: '状态判断',
                  desc: '通过 result?.type 判断数据状态，处理 success、error、null 等不同情况',
                  icon: '🔍',
                },
                {
                  title: '加载状态',
                  desc: '使用 loading 函数显示加载状态，提供良好的用户体验',
                  icon: '⏳',
                },
                {
                  title: '错误处理',
                  desc: '妥善处理错误状态，给用户明确的反馈信息',
                  icon: '🚨',
                },
              ];

              practices.forEach(practice => {
                fdom.div({
                  className() {
                    const colors = themeColors();
                    return `p-4 rounded-lg ${colors.bg} border-l-4 border-blue-500`;
                  },
                  children() {
                    fdom.div({
                      className: 'flex items-start gap-3',
                      children() {
                        fdom.span({
                          className: 'text-lg',
                          childrenType: 'text',
                          children: practice.icon,
                        });

                        fdom.div({
                          children() {
                            fdom.h4({
                              className: 'font-semibold mb-1',
                              childrenType: 'text',
                              children: practice.title,
                            });

                            fdom.p({
                              className() {
                                const colors = themeColors();
                                return `text-sm ${colors.textSecondary}`;
                              },
                              childrenType: 'text',
                              children: practice.desc,
                            });
                          },
                        });
                      },
                    });
                  },
                });
              });
            },
          });
        },
      });
    },
  });
}
