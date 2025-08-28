import { fdom } from "mve-dom";
import { renderIf, renderOne } from "mve-helper";
import { gContext } from "../../gContext";
import comprehensiveContext from "../comprehensive-context";

export default function () {
  const { themeColors } = gContext.consume();
  const { getUserData, userLoading, taskStats } = comprehensiveContext.consume();

  fdom.div({
    className: "max-w-2xl mx-auto space-y-6",
    children() {
      renderIf(() => !userLoading() && !getUserData(), function () {
        fdom.div({
          className: "text-center py-12",
          children() {
            fdom.p({
              className() {
                const colors = themeColors();

                return colors.textSecondary;
              },
              childrenType: "text",
              children: "请先登录"
            });
          }
        });
      })
      renderIf(
        userLoading,
        () => {
          fdom.div({
            className: "text-center py-12",
            childrenType: "text",
            children: "加载中..."
          });
        }
      );
      renderOne(getUserData, function (o) {
        if (o?.type == 'success') {
          const user = o.value

          // 用户信息卡片
          fdom.div({
            className() {
              const colors = themeColors();

              return `${colors.cardBg} ${colors.border} border rounded-2xl p-8 shadow-lg text-center`;
            },
            children() {
              fdom.div({
                className: "w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl text-white",
                childrenType: "text",
                children: user.avatar
              });

              fdom.h2({
                className: "text-2xl font-bold mb-2",
                childrenType: "text",
                children: user.name
              });

              fdom.p({
                className() {
                  const colors = themeColors();

                  return colors.textSecondary;
                },
                childrenType: "text",
                children: user.email
              });
            }
          });

          // 统计信息
          fdom.div({
            className() {
              const colors = themeColors();

              return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
            },
            children() {
              fdom.h3({
                className: "text-lg font-semibold mb-4",
                childrenType: "text",
                children: "📊 我的统计"
              });

              fdom.div({
                className: "grid grid-cols-3 gap-4 text-center",
                children() {
                  const stats = taskStats();
                  const userStats = [
                    { label: "总任务", value: stats.total },
                    { label: "已完成", value: stats.done },
                    { label: "进行中", value: stats.doing }
                  ];

                  userStats.forEach(stat => {
                    fdom.div({
                      children() {
                        fdom.div({
                          className: "text-2xl font-bold text-blue-500 mb-1",
                          childrenType: "text",
                          children: stat.value.toString()
                        });

                        fdom.div({
                          className() {
                            const colors = themeColors();

                            return `text-sm ${colors.textSecondary}`;
                          },
                          childrenType: "text",
                          children: stat.label
                        });
                      }
                    });
                  });
                }
              });
            }
          });
        }
      })
    }
  });
}