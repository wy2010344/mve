/**
 * 组件展示页面 - 使用 Tailwind CSS 处理布局样式
 */

import { fdom } from 'mve-dom';
import { createSignal, EmptyFun } from 'wy-helper';
import { hookRewriteTheme } from './util';
import { Button } from './button';
import { renderIf, renderOne, promiseSignal, renderOrKey } from 'mve-helper';
import { Input } from './input';

// 组件分类配置
interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  components: ComponentItem[];
}

interface ComponentItem {
  id: string;
  name: string;
  description: string;
  showcase: () => Promise<{ default: EmptyFun }>;
  status?: 'stable' | 'beta' | 'alpha' | 'deprecated';
}

const componentCategories: ComponentCategory[] = [
  {
    id: 'basic',
    name: '基础组件',
    icon: '🧱',
    description: '最基础的 UI 组件',
    components: [
      {
        id: 'button',
        name: 'Button 按钮',
        description: '触发业务逻辑的按钮组件',
        showcase: () => import('./button/showcase'),
        status: 'stable',
      },
    ],
  },
  {
    id: 'form',
    name: '表单组件',
    icon: '📝',
    description: '用于数据输入和表单处理',
    components: [
      {
        id: 'input',
        name: 'Input 输入框',
        description: '基础的文本输入组件',
        showcase: () => import('./input/showcase'),
        status: 'stable',
      },
    ],
  },
  {
    id: 'layout',
    name: '布局组件',
    icon: '📐',
    description: '页面布局和容器组件',
    components: [
      {
        id: 'layout',
        name: 'Layout 布局',
        description: '网格和弹性布局组件',
        showcase: () => import('./layout/showcase'),
        status: 'stable',
      },
    ],
  },
  {
    id: 'display',
    name: '展示组件',
    icon: '🎨',
    description: '用于内容展示的组件',
    components: [
      {
        id: 'card',
        name: 'Card 卡片',
        description: '信息展示的卡片容器',
        showcase: () => import('./card/showcase'),
        status: 'stable',
      },
    ],
  },
  {
    id: 'feedback',
    name: '反馈组件',
    icon: '💬',
    description: '用户反馈和状态提示',
    components: [
      {
        id: 'notification',
        name: 'Notification 通知',
        description: '全局通知提醒组件',
        showcase: () => import('./feedback/notification-showcase'),
        status: 'stable',
      },
      {
        id: 'badge',
        name: 'Badge 徽章',
        description: '状态标记和数字提示',
        showcase: () => import('./feedback/badge-showcase'),
        status: 'stable',
      },
      {
        id: 'alert',
        name: 'Alert 提示框',
        description: '页面级别的提示信息',
        showcase: () => import('./feedback/alert-showcase'),
        status: 'stable',
      },
      {
        id: 'progress',
        name: 'Progress 进度条',
        description: '展示操作进度',
        showcase: () => import('./feedback/progress-showcase'),
        status: 'stable',
      },
    ],
  },
  {
    id: 'advanced',
    name: '高级组件',
    icon: '⚡',
    description: '更复杂的交互组件',
    components: [
      {
        id: 'switch',
        name: 'Switch 开关',
        description: '开关选择器',
        showcase: () => import('./advanced/showcase'),
        status: 'stable',
      },
      {
        id: 'tag',
        name: 'Tag 标签',
        description: '标记和分类',
        showcase: () => import('./advanced/showcase'),
        status: 'stable',
      },
      {
        id: 'avatar',
        name: 'Avatar 头像',
        description: '用户头像展示',
        showcase: () => import('./advanced/showcase'),
        status: 'stable',
      },
      {
        id: 'rating',
        name: 'Rating 评分',
        description: '评分组件',
        showcase: () => import('./advanced/showcase'),
        status: 'stable',
      },
      {
        id: 'skeleton',
        name: 'Skeleton 骨架屏',
        description: '加载占位符',
        showcase: () => import('./advanced/showcase'),
        status: 'stable',
      },
    ],
  },
];

export function ComponentShowcase() {
  const activeCategory = createSignal('basic');
  const activeComponent = createSignal('button');
  const currentPrefix = createSignal('ds-');
  const searchQuery = createSignal('');
  const sidebarCollapsed = createSignal(false);

  // 主题切换函数
  function switchTheme(prefix: string, colors?: any) {
    currentPrefix.set(prefix);
    hookRewriteTheme(oldTheme => ({
      ...oldTheme,
      prefix,
      tokens: {
        ...oldTheme.tokens,
        ...colors,
      },
    }));
  }

  // 获取当前激活的组件
  function getActiveComponent(): ComponentItem | null {
    const categoryId = activeCategory.get();
    const componentId = activeComponent.get();

    for (const category of componentCategories) {
      if (category.id === categoryId) {
        return (
          category.components.find(comp => comp.id === componentId) || null
        );
      }
    }
    return null;
  }

  // 过滤组件
  function getFilteredCategories(): ComponentCategory[] {
    const query = searchQuery.get().toLowerCase();
    if (!query) return componentCategories;

    return componentCategories
      .map(category => ({
        ...category,
        components: category.components.filter(
          comp =>
            comp.name.toLowerCase().includes(query) ||
            comp.description.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.components.length > 0);
  }

  // 顶部工具栏
  fdom.div({
    className: 'bg-white rounded-xl border border-gray-200 p-4 m-6 shadow-sm',
    children() {
      fdom.div({
        className: 'flex items-center justify-between',
        children() {
          // 左侧：标题和搜索
          fdom.div({
            className: 'flex items-center gap-6',
            children() {
              fdom.div({
                children() {
                  fdom.h1({
                    className: 'text-2xl font-bold text-gray-900',
                    children: '🎨 组件展示',
                  });

                  fdom.p({
                    className: 'text-sm text-gray-500 mt-1',
                    children() {
                      return `当前主题前缀: ${currentPrefix.get()}`;
                    },
                  });
                },
              });

              // 搜索框
              fdom.div({
                className: 'relative w-80',
                children() {
                  Input({
                    value: searchQuery,
                    placeholder: '搜索组件...',
                    className: 'text-sm',
                  });
                },
              });
            },
          });

          // 右侧：主题切换和工具
          fdom.div({
            className: 'flex items-center gap-2',
            children() {
              Button({
                variant: 'ghost',
                size: 'sm',
                children: sidebarCollapsed.get() ? '展开' : '收起',
                onClick: () => sidebarCollapsed.set(!sidebarCollapsed.get()),
              });

              Button({
                variant: 'primary',
                size: 'sm',
                children: '默认',
                onClick: () => switchTheme('ds-'),
              });

              Button({
                variant: 'secondary',
                size: 'sm',
                children: '蓝色',
                onClick: () =>
                  switchTheme('blue-', {
                    primary: '#3b82f6',
                    onPrimary: '#ffffff',
                  }),
              });

              Button({
                variant: 'tertiary',
                size: 'sm',
                children: '绿色',
                onClick: () =>
                  switchTheme('green-', {
                    primary: '#10b981',
                    onPrimary: '#ffffff',
                  }),
              });
            },
          });
        },
      });
    },
  });

  // 主要内容区域
  fdom.div({
    className: 'flex flex-1 min-h-0 gap-6 mx-6 mb-6 items-stretch',
    children() {
      // 左侧边栏
      fdom.div({
        className() {
          return sidebarCollapsed.get()
            ? 'hidden'
            : 'w-72 flex-shrink-0 overflow-y-auto bg-white border border-gray-200 rounded-xl p-4 sticky top-6';
        },
        children() {
          SidebarNavigation();
        },
      });

      // 右侧内容区域
      fdom.div({
        className:
          'flex-1 min-w-0 overflow-y-auto bg-white border border-gray-200 rounded-xl p-6 ',
        children() {
          ContentArea();
        },
      });
    },
  });

  // 侧边栏导航
  function SidebarNavigation() {
    const filteredCategories = getFilteredCategories();

    filteredCategories.forEach(category => {
      fdom.div({
        className: 'mb-4',
        children() {
          // 分类标题
          fdom.div({
            className() {
              const baseClasses =
                'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors';
              const activeClasses =
                activeCategory.get() === category.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50';
              return `${baseClasses} ${activeClasses}`;
            },
            onClick: () => {
              activeCategory.set(category.id);
              if (category.components.length > 0) {
                activeComponent.set(category.components[0].id);
              }
            },
            children() {
              fdom.span({
                className: 'text-lg',
                children: category.icon,
              });

              fdom.div({
                className: 'flex-1',
                children() {
                  fdom.div({
                    className: 'text-sm font-medium',
                    children: category.name,
                  });

                  fdom.div({
                    className: 'text-xs text-gray-500 mt-0.5',
                    children: category.description,
                  });
                },
              });
            },
          });

          // 组件列表
          renderIf(
            () => activeCategory.get() === category.id,
            function () {
              fdom.div({
                className: 'ml-6 mt-2 space-y-1',
                children() {
                  category.components.forEach(component => {
                    fdom.div({
                      className() {
                        const baseClasses =
                          'flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors';
                        const activeClasses =
                          activeComponent.get() === component.id
                            ? 'bg-blue-100 text-blue-800'
                            : 'hover:bg-gray-50';
                        return `${baseClasses} ${activeClasses}`;
                      },
                      onClick: () => activeComponent.set(component.id),
                      children() {
                        fdom.div({
                          className: 'flex-1',
                          children() {
                            fdom.div({
                              className: 'text-sm font-medium',
                              children: component.name,
                            });

                            fdom.div({
                              className: 'text-xs text-gray-500 mt-0.5',
                              children: component.description,
                            });
                          },
                        });

                        // 状态标签
                        if (component.status && component.status !== 'stable') {
                          fdom.span({
                            className() {
                              const baseClasses =
                                'text-xs font-medium px-2 py-0.5 rounded';
                              const statusClasses =
                                component.status === 'beta'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : component.status === 'alpha'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800';
                              return `${baseClasses} ${statusClasses}`;
                            },
                            children: component.status,
                          });
                        }
                      },
                    });
                  });
                },
              });
            }
          );
        },
      });
    });
  }

  // 内容区域
  function ContentArea() {
    renderOne(getActiveComponent, function (activeComp) {
      if (activeComp) {
        // 组件标题和描述
        fdom.div({
          className: 'border-b border-gray-200 pb-4 mb-6',
          children() {
            fdom.h2({
              className: 'text-xl font-bold text-gray-900',
              children: activeComp.name,
            });

            fdom.p({
              className: 'text-gray-600 mt-2',
              children: activeComp.description,
            });
          },
        });

        // 组件展示内容
        fdom.div({
          className: 'space-y-6',
          children() {
            const out = promiseSignal(activeComp.showcase());
            renderOrKey(out.get, 'type', function (type, get) {
              if (type == 'success') {
                get().value.default();
              } else {
              }
            });
          },
        });
      } else {
        // 空状态
        fdom.div({
          className:
            'flex flex-col items-center justify-center h-96 text-center',
          children() {
            fdom.div({
              className: 'text-4xl mb-4',
              children: '🔍',
            });

            fdom.p({
              className: 'text-lg font-medium text-gray-900 mb-2',
              children: '未找到匹配的组件',
            });

            fdom.p({
              className: 'text-gray-500',
              children: '请尝试调整搜索条件或选择其他分类',
            });
          },
        });
      }
    });
  }
}
