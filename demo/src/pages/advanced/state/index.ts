import { fdom } from 'mve-dom';
import { renderArrayKey, renderIf } from 'mve-helper';
import { renderInput } from 'mve-dom-helper';
import { SetValue } from 'wy-helper';
import { gContext } from '../../gContext';
import advancedContext from '../advanced-context';

export default function () {
  const { themeColors } = gContext.consume();
  const {
    filterCategory,
    sortBy,
    sortOrder,
    filteredAndSortedItems,
    dataStatistics,
  } = advancedContext.consume();

  fdom.div({
    className: 'space-y-8',
    children() {
      fdom.div({
        className: 'text-center mb-8',
        children() {
          fdom.h2({
            className: 'text-2xl font-bold mb-4',
            childrenType: 'text',
            children: '🧠 复杂状态管理',
          });

          fdom.p({
            className() {
              return `text-lg ${themeColors().textSecondary}`;
            },
            childrenType: 'text',
            children: '多层级状态、复杂计算、智能缓存等状态管理技术',
          });
        },
      });

      // 统计信息
      fdom.div({
        className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8',
        children() {
          // ✅ 在 children 函数中调用，会动态更新
          const stats = dataStatistics();
          const statItems = [
            { label: '总数', value: stats.total, color: 'blue' },
            { label: '分类', value: stats.categories, color: 'green' },
            { label: '总值', value: stats.totalValue, color: 'purple' },
            { label: '平均', value: stats.avgValue, color: 'yellow' },
            { label: '活跃', value: stats.activeCount, color: 'emerald' },
            { label: '非活跃', value: stats.inactiveCount, color: 'gray' },
          ];

          statItems.forEach(item => {
            fdom.div({
              className() {
                return `${themeColors().cardBg} ${themeColors().border} border rounded-xl p-4 text-center`;
              },
              children() {
                fdom.div({
                  className: `text-xl font-bold text-${item.color}-600 mb-1`,
                  childrenType: 'text',
                  children: item.value.toString(),
                });

                fdom.div({
                  className() {
                    return `text-xs ${themeColors().textSecondary}`;
                  },
                  childrenType: 'text',
                  children: item.label,
                });
              },
            });
          });
        },
      });

      // 过滤和排序控制
      fdom.div({
        className() {
          return `${themeColors().cardBg} ${themeColors().border} border rounded-2xl p-6 shadow-lg mb-6`;
        },
        children() {
          fdom.h3({
            className: 'text-lg font-semibold mb-4',
            childrenType: 'text',
            children: '🔧 数据控制',
          });

          fdom.div({
            className: 'grid grid-cols-1 md:grid-cols-3 gap-4',
            children() {
              // 分类过滤
              fdom.div({
                children() {
                  fdom.label({
                    className() {
                      const colors = themeColors();
                      return `block text-sm font-medium ${colors.textSecondary} mb-2`;
                    },
                    childrenType: 'text',
                    children: '分类过滤',
                  });

                  renderInput(
                    filterCategory.get,
                    filterCategory.set,
                    fdom.select({
                      className() {
                        const colors = themeColors();
                        return `w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.cardBg} ${colors.text}`;
                      },
                      children() {
                        const categories = [
                          'all',
                          '技术',
                          '设计',
                          '产品',
                          '运营',
                          '市场',
                        ];
                        categories.forEach(category => {
                          fdom.option({
                            value: category,
                            childrenType: 'text',
                            children: category === 'all' ? '全部' : category,
                          });
                        });
                      },
                    })
                  );
                },
              });

              // 排序字段
              fdom.div({
                children() {
                  fdom.label({
                    className() {
                      const colors = themeColors();
                      return `block text-sm font-medium ${colors.textSecondary} mb-2`;
                    },
                    childrenType: 'text',
                    children: '排序字段',
                  });

                  renderInput(
                    sortBy.get,
                    sortBy.set as SetValue<any>,
                    fdom.select({
                      className() {
                        const colors = themeColors();
                        return `w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.cardBg} ${colors.text}`;
                      },
                      children() {
                        const options = [
                          { value: 'name', label: '名称' },
                          { value: 'value', label: '数值' },
                          { value: 'timestamp', label: '时间' },
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

              // 排序方向
              fdom.div({
                children() {
                  fdom.label({
                    className() {
                      const colors = themeColors();
                      return `block text-sm font-medium ${colors.textSecondary} mb-2`;
                    },
                    childrenType: 'text',
                    children: '排序方向',
                  });

                  renderInput(
                    sortOrder.get,
                    sortOrder.set as SetValue<any>,
                    fdom.select({
                      className() {
                        const colors = themeColors();
                        return `w-full px-3 py-2 rounded-lg border ${colors.border} ${colors.cardBg} ${colors.text}`;
                      },
                      children() {
                        fdom.option({
                          value: 'asc',
                          childrenType: 'text',
                          children: '升序',
                        });
                        fdom.option({
                          value: 'desc',
                          childrenType: 'text',
                          children: '降序',
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

      // 数据列表
      fdom.div({
        className() {
          const colors = themeColors();
          return `${colors.cardBg} ${colors.border} border rounded-2xl shadow-lg overflow-hidden`;
        },
        children() {
          fdom.div({
            className() {
              const colors = themeColors();
              return `p-4 ${colors.border} border-b`;
            },
            children() {
              fdom.h3({
                className: 'text-lg font-semibold',
                childrenType: 'text',
                children() {
                  return `📊 数据列表 (${filteredAndSortedItems().length})`;
                },
              });
            },
          });

          fdom.div({
            className: 'max-h-96 overflow-y-auto',
            children() {
              renderIf(
                () => filteredAndSortedItems().length === 0,
                () => {
                  fdom.div({
                    className: 'p-8 text-center',
                    children() {
                      fdom.div({
                        className: 'text-4xl mb-2 opacity-20',
                        childrenType: 'text',
                        children: '📭',
                      });

                      fdom.p({
                        className() {
                          const colors = themeColors();
                          return colors.textSecondary;
                        },
                        childrenType: 'text',
                        children: '暂无数据，请先生成测试数据',
                      });
                    },
                  });
                },
                () => {
                  renderArrayKey(
                    () => filteredAndSortedItems().slice(0, 20),
                    item => item.id,
                    getItem => {
                      const item = getItem();

                      fdom.div({
                        className() {
                          const colors = themeColors();
                          return `flex items-center justify-between p-4 ${colors.border} border-b last:border-b-0 ${colors.hover} transition-colors duration-150`;
                        },
                        children() {
                          fdom.div({
                            className: 'flex items-center gap-3',
                            children() {
                              // 状态指示器
                              fdom.div({
                                className() {
                                  return `w-3 h-3 rounded-full ${item.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`;
                                },
                              });

                              fdom.div({
                                children() {
                                  fdom.div({
                                    className: 'font-medium',
                                    childrenType: 'text',
                                    children: item.name,
                                  });

                                  fdom.div({
                                    className() {
                                      const colors = themeColors();
                                      return `text-sm ${colors.textSecondary}`;
                                    },
                                    childrenType: 'text',
                                    children: `${item.category} | ${item.timestamp.toLocaleDateString()}`,
                                  });
                                },
                              });
                            },
                          });

                          fdom.div({
                            className: 'text-right',
                            children() {
                              fdom.div({
                                className: 'font-semibold text-purple-600',
                                childrenType: 'text',
                                children: item.value.toString(),
                              });

                              fdom.div({
                                className() {
                                  const colors = themeColors();
                                  return `text-xs ${colors.textSecondary}`;
                                },
                                childrenType: 'text',
                                children: item.status,
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
