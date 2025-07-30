import { fdom } from "mve-dom";
import { renderArrayKey, renderIf } from "mve-helper";
import { gContext } from "../../gContext";

export default function () {
  const { themeColors, addNotification, getNotifications } = gContext.consume();

  fdom.div({
    className: "space-y-8",
    children() {
      fdom.div({
        className: "text-center mb-8",
        children() {
          fdom.h2({
            className: "text-2xl font-bold mb-4",
            childrenType: "text",
            children: "🔔 通知系统"
          });

          fdom.p({
            className() {
              return `text-lg ${themeColors().textSecondary}`;
            },
            childrenType: "text",
            children: "全局通知管理、自动清理、类型化通知等功能"
          });
        }
      });

      // 通知测试按钮
      fdom.div({
        className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8",
        children() {
          const notificationTypes = [
            { type: "info", label: "信息", color: "bg-blue-500", icon: "ℹ️" },
            { type: "success", label: "成功", color: "bg-green-500", icon: "✅" },
            { type: "warning", label: "警告", color: "bg-yellow-500", icon: "⚠️" },
            { type: "error", label: "错误", color: "bg-red-500", icon: "❌" }
          ];

          notificationTypes.forEach(notif => {
            fdom.button({
              onClick() {
                addNotification({
                  type: notif.type as any,
                  title: `${notif.label}通知`,
                  message: `这是一个${notif.label}类型的通知消息`
                });
              },
              className: `${notif.color} text-white p-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-2`,
              children() {
                fdom.span({
                  className: "text-2xl",
                  childrenType: "text",
                  children: notif.icon
                });

                fdom.span({
                  childrenType: "text",
                  children: notif.label
                });
              }
            });
          });
        }
      });

      // 通知历史
      fdom.div({
        className() {
          return `${themeColors().cardBg} ${themeColors().border} border rounded-2xl shadow-lg overflow-hidden`;
        },
        children() {
          fdom.div({
            className() {
              return `p-4 ${themeColors().border} border-b`;
            },
            children() {
              fdom.h3({
                className: "text-lg font-semibold",
                childrenType: "text",
                children: "📋 通知历史"
              });
            }
          });

          fdom.div({
            className: "max-h-64 overflow-y-auto",
            children() {
              renderIf(
                () => getNotifications().length === 0,
                () => {
                  fdom.div({
                    className: "p-8 text-center",
                    children() {
                      fdom.p({
                        className() {
                          return themeColors().textSecondary;
                        },
                        childrenType: "text",
                        children: "暂无通知记录"
                      });
                    }
                  });
                },
                () => {
                  renderArrayKey(
                    () => getNotifications(),
                    (notification) => notification.id,
                    (getNotification) => {
                      const notification = getNotification();

                      fdom.div({
                        className() {
                          const colors = themeColors();
                          return `p-4 ${colors.border} border-b last:border-b-0`;
                        },
                        children() {
                          fdom.div({
                            className: "flex items-start gap-3",
                            children() {
                              fdom.div({
                                className() {
                                  const typeColors = {
                                    info: "bg-blue-100 text-blue-800",
                                    success: "bg-green-100 text-green-800",
                                    warning: "bg-yellow-100 text-yellow-800",
                                    error: "bg-red-100 text-red-800"
                                  };
                                  return `px-2 py-1 rounded-full text-xs font-medium ${typeColors[notification.type]}`;
                                },
                                childrenType: "text",
                                children: notification.type
                              });

                              fdom.div({
                                className: "flex-1",
                                children() {
                                  fdom.h4({
                                    className: "font-medium mb-1",
                                    childrenType: "text",
                                    children: notification.title
                                  });

                                  fdom.p({
                                    className() {
                                      const colors = themeColors();
                                      return `text-sm ${colors.textSecondary} mb-1`;
                                    },
                                    childrenType: "text",
                                    children: notification.message
                                  });

                                  fdom.p({
                                    className() {
                                      const colors = themeColors();
                                      return `text-xs ${colors.textSecondary}`;
                                    },
                                    childrenType: "text",
                                    children: notification.timestamp.toLocaleString()
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  );
                }
              );
            }
          });
        }
      });

      // 通知系统说明
      fdom.div({
        className() {
          const colors = themeColors();
          return `${colors.cardBg} ${colors.border} border rounded-2xl p-6 shadow-lg`;
        },
        children() {
          fdom.h3({
            className: "text-xl font-semibold mb-4",
            childrenType: "text",
            children: "📝 通知系统特性"
          });

          fdom.div({
            className: "space-y-4",
            children() {
              const features = [
                {
                  title: "全局状态管理",
                  desc: "通过 Context 实现全局通知状态管理",
                  icon: "🌐"
                },
                {
                  title: "类型化通知",
                  desc: "支持 info、success、warning、error 四种类型",
                  icon: "🏷️"
                },
                {
                  title: "自动清理",
                  desc: "通知会自动清理，避免内存泄漏",
                  icon: "🧹"
                },
                {
                  title: "实时更新",
                  desc: "基于 Signal 的实时通知更新",
                  icon: "⚡"
                }
              ];

              features.forEach(feature => {
                fdom.div({
                  className() {
                    const colors = themeColors();
                    return `p-4 rounded-lg ${colors.bg} border-l-4 border-blue-500`;
                  },
                  children() {
                    fdom.div({
                      className: "flex items-start gap-3",
                      children() {
                        fdom.span({
                          className: "text-lg",
                          childrenType: "text",
                          children: feature.icon
                        });

                        fdom.div({
                          children() {
                            fdom.h4({
                              className: "font-semibold mb-1",
                              childrenType: "text",
                              children: feature.title
                            });

                            fdom.p({
                              className() {
                                const colors = themeColors();
                                return `text-sm ${colors.textSecondary}`;
                              },
                              childrenType: "text",
                              children: feature.desc
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
        }
      });
    }
  });
}