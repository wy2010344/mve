import { fdom } from "mve-dom";
import { renderArrayKey, renderIf } from "mve-helper";
import { gContext } from "../../gContext";
import comprehensiveContext from "../comprehensive-context";

export default function () {
  const { themeColors } = gContext.consume();
  const { getTasks, taskStats, tasksLoading } = comprehensiveContext.consume();

  fdom.div({
    className: "space-y-6",
    children() {
      // 统计卡片
      fdom.div({
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
        children() {
          const statCards = [
            { label: "总任务", value: () => taskStats().total, color: "blue", icon: "📋" },
            { label: "待办", value: () => taskStats().todo, color: "yellow", icon: "⏳" },
            { label: "进行中", value: () => taskStats().doing, color: "purple", icon: "🔄" },
            { label: "已完成", value: () => taskStats().done, color: "green", icon: "✅" }
          ];

          statCards.forEach(card => {
            fdom.div({
              className() {
                const colors = themeColors();
                return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`;
              },
              children() {
                fdom.div({
                  className: "flex items-center justify-between",
                  children() {
                    fdom.div({
                      children() {
                        fdom.p({
                          className() {
                            const colors = themeColors();
                            return `text-sm ${colors.textSecondary} mb-1`;
                          },
                          childrenType: "text",
                          children: card.label
                        });

                        fdom.p({
                          className: `text-3xl font-bold text-${card.color}-600`,
                          childrenType: "text",
                          children: card.value
                        });
                      }
                    });

                    fdom.div({
                      className: "text-4xl opacity-20",
                      childrenType: "text",
                      children: card.icon
                    });
                  }
                });
              }
            });
          });
        }
      });

      // 最近任务
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
                className: "text-lg font-semibold",
                childrenType: "text",
                children: "📝 最近任务"
              });
            }
          });

          fdom.div({
            className: "p-6",
            children() {
              renderIf(
                tasksLoading,
                () => {
                  fdom.div({
                    className: "text-center py-8",
                    childrenType: "text",
                    children: "加载中..."
                  });
                }
              );
              renderIf(
                () => getTasks().length == 0,
                function () {
                  fdom.p({
                    className() {
                      const colors = themeColors();
                      return `text-center ${colors.textSecondary} py-8`;
                    },
                    childrenType: "text",
                    children: "暂无任务"
                  });
                }, function () {
                  fdom.div({
                    className: "space-y-4",
                    children() {
                      renderArrayKey(() => getTasks().slice(0, 5), v => v.id, function (getTask) {
                        fdom.div({
                          className() {
                            const colors = themeColors();
                            return `flex items-center gap-4 p-4 rounded-lg ${colors.hover} transition-colors duration-200`;
                          },
                          children() {
                            // 状态指示器
                            fdom.div({
                              className() {
                                const statusColors = {
                                  todo: "bg-yellow-500",
                                  doing: "bg-purple-500",
                                  done: "bg-green-500"
                                };
                                return `w-3 h-3 rounded-full ${statusColors[getTask().status]}`;
                              }
                            });

                            fdom.div({
                              className: "flex-1",
                              children() {
                                fdom.h4({
                                  className: "font-medium mb-1",
                                  childrenType: "text",
                                  children() {
                                    return getTask().title
                                  }
                                });

                                fdom.p({
                                  className() {
                                    const colors = themeColors();
                                    return `text-sm ${colors.textSecondary}`;
                                  },
                                  childrenType: "text",
                                  children() {
                                    return getTask().description
                                  }
                                });
                              }
                            });

                            fdom.div({
                              className: "text-right",
                              children() {
                                fdom.span({
                                  className() {
                                    const priorityColors = {
                                      low: "bg-gray-100 text-gray-800",
                                      medium: "bg-yellow-100 text-yellow-800",
                                      high: "bg-red-100 text-red-800"
                                    };
                                    return `px-2 py-1 rounded-full text-xs font-medium ${priorityColors[getTask().priority]}`;
                                  },
                                  childrenType: "text",
                                  children() {
                                    return getTask().priority
                                  }
                                });
                              }
                            });
                          }
                        });
                      })
                    }
                  });
                })
            }
          });
        }
      });
    }
  });
}