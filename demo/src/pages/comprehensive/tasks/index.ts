import { fdom } from 'mve-dom';
import { renderArrayKey, renderIf, renderArray } from 'mve-helper';
import { renderInput } from 'mve-dom-helper';
import { gContext } from '../../gContext';
import comprehensiveContext from '../comprehensive-context';

export default function () {
  const { themeColors } = gContext.consume();
  const { getTasks, tasksLoading, updateTaskStatus } =
    comprehensiveContext.consume();

  fdom.div({
    className: 'space-y-6',
    children() {
      // 任务列表
      fdom.div({
        className() {
          const colors = themeColors();

          return `${colors.cardBg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden`;
        },
        children() {
          fdom.div({
            className() {
              const colors = themeColors();

              return `p-6 ${colors.border} border-b`;
            },
            children() {
              fdom.h3({
                className: 'text-lg font-semibold',
                childrenType: 'text',
                children: '📋 所有任务',
              });
            },
          });

          fdom.div({
            className: 'divide-y divide-gray-200 dark:divide-gray-700',
            children() {
              renderIf(
                tasksLoading,
                () => {
                  fdom.div({
                    className: 'p-8 text-center',
                    childrenType: 'text',
                    children: '加载任务中...',
                  });
                },
                () => {
                  renderArrayKey(
                    getTasks,
                    task => task.id,
                    getTask => {
                      fdom.div({
                        className() {
                          const colors = themeColors();

                          return `p-6 ${colors.hover} transition-colors duration-200`;
                        },
                        children() {
                          fdom.div({
                            className: 'flex items-start justify-between',
                            children() {
                              fdom.div({
                                className: 'flex-1',
                                children() {
                                  fdom.div({
                                    className: 'flex items-center gap-3 mb-2',
                                    children() {
                                      fdom.h3({
                                        className: 'text-lg font-semibold',
                                        childrenType: 'text',
                                        children() {
                                          return getTask().title;
                                        },
                                      });

                                      fdom.span({
                                        className() {
                                          const priorityColors = {
                                            low: 'bg-gray-100 text-gray-800',
                                            medium:
                                              'bg-yellow-100 text-yellow-800',
                                            high: 'bg-red-100 text-red-800',
                                          };
                                          return `px-2 py-1 rounded-full text-xs font-medium ${priorityColors[getTask().priority]}`;
                                        },
                                        childrenType: 'text',
                                        children() {
                                          return getTask().priority;
                                        },
                                      });
                                    },
                                  });

                                  fdom.p({
                                    className() {
                                      const colors = themeColors();

                                      return `${colors.textSecondary} mb-3`;
                                    },
                                    childrenType: 'text',
                                    children() {
                                      return getTask().description;
                                    },
                                  });

                                  // 标签
                                  fdom.div({
                                    className: 'flex flex-wrap gap-2',
                                    children() {
                                      renderArray(
                                        () => getTask().tags,
                                        function (tag) {
                                          fdom.span({
                                            className:
                                              'px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs',
                                            childrenType: 'text',
                                            children: tag,
                                          });
                                        }
                                      );
                                    },
                                  });
                                },
                              });

                              fdom.div({
                                className: 'ml-4',
                                children() {
                                  // 状态选择
                                  renderInput(
                                    () => getTask().status,
                                    value => {
                                      updateTaskStatus(
                                        getTask().id,
                                        value as any
                                      );
                                    },
                                    fdom.select({
                                      className() {
                                        const statusColors = {
                                          todo: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                                          doing:
                                            'bg-purple-100 text-purple-800 border-purple-300',
                                          done: 'bg-green-100 text-green-800 border-green-300',
                                        };
                                        return `px-3 py-1 rounded-lg text-sm font-medium border ${statusColors[getTask().status]}`;
                                      },
                                      children() {
                                        const options = [
                                          { value: 'todo', label: '待办' },
                                          { value: 'doing', label: '进行中' },
                                          { value: 'done', label: '已完成' },
                                        ];

                                        options.forEach(option => {
                                          fdom.option({
                                            value: option.value,
                                            childrenType: 'text',
                                            children: option.label,
                                          });
                                        });
                                      },
                                    })
                                  );
                                },
                              });
                            },
                          });
                        },
                      });
                    }
                  );
                }
              );
            },
          });
        },
      });
    },
  });
}
