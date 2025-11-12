/**
 * 组件展示页面 - 优化版
 * 展示基于Material Design 3.0的完整组件系统
 */

import { fdom } from 'mve-dom';
import { createSignal, toProxySignal } from 'wy-helper';
import { panel } from './window';
import { renderOne } from 'mve-helper';
import {
  renderTypeCard,
  renderColorPickerLabel,
  renderStatusIndicator,
} from './typeCard';

interface ComponentShowcaseState {
  selectedCategory: string;
  searchQuery: string;
  viewMode: 'grid' | 'list';
}

export const componentShowcase = panel(function () {
  const state: ComponentShowcaseState = toProxySignal({
    selectedCategory: 'buttons',
    searchQuery: '',
    viewMode: 'grid',
  });

  return {
    title: '🧩 Material Design 3.0 组件展示',
    typeIcon: '🧩',
    width: createSignal(1200),
    height: createSignal(800),
    children() {
      // 顶部工具栏
      renderToolbar(state);

      // 主内容区域
      fdom.div({
        className: 'ds-flex',
        s_flex: '1',
        s_overflow: 'hidden',
        children() {
          // 左侧分类导航
          renderCategoryNav(state);
          // 右侧组件展示区域
          renderComponentArea(state);
        },
      });
    },
  };
});

function renderToolbar(state: ComponentShowcaseState) {
  fdom.div({
    className:
      'ds-flex ds-items-center ds-justify-between ds-p-md ds-border-b ds-border-subtle',
    children() {
      // 搜索框
      fdom.div({
        className: 'ds-flex ds-items-center ds-gap-sm',
        children() {
          fdom.input({
            type: 'text',
            placeholder: '🔍 搜索组件...',
            className: 'ds-input ds-input--sm',
            s_width: '240px',
            value: () => state.searchQuery,
            onInput: e => {
              state.searchQuery = (e.target as HTMLInputElement).value;
            },
          });
        },
      });

      // 视图切换
      fdom.div({
        className: 'ds-flex ds-items-center ds-gap-xs',
        children() {
          fdom.button({
            className: () =>
              `ds-icon-button ${
                state.viewMode === 'grid'
                  ? 'ds-icon-button--primary'
                  : 'ds-icon-button--secondary'
              }`,
            onClick: () => (state.viewMode = 'grid'),
            title: '网格视图',
            children: '⊞',
          });
          fdom.button({
            className: () =>
              `ds-icon-button ${
                state.viewMode === 'list'
                  ? 'ds-icon-button--primary'
                  : 'ds-icon-button--secondary'
              }`,
            onClick: () => (state.viewMode = 'list'),
            title: '列表视图',
            children: '☰',
          });
        },
      });
    },
  });
}
function renderCategoryNav(state: ComponentShowcaseState) {
  const categories = [
    { id: 'buttons', name: '按钮', icon: '🔘', count: 12 },
    { id: 'inputs', name: '输入框', icon: '📝', count: 8 },
    { id: 'cards', name: '卡片', icon: '🃏', count: 6 },
    { id: 'navigation', name: '导航', icon: '🧭', count: 5 },
    { id: 'feedback', name: '反馈', icon: '💬', count: 10 },
    { id: 'data', name: '数据展示', icon: '📊', count: 7 },
    { id: 'layout', name: '布局', icon: '📐', count: 4 },
    { id: 'overlays', name: '浮层', icon: '🎭', count: 6 },
    { id: 'advanced', name: '高级组件', icon: '⚡', count: 9 },
  ];

  fdom.div({
    className:
      'ds-w-64 ds-h-full ds-border-r ds-border-subtle ds-bg-surface-container',
    children() {
      fdom.div({
        className: 'ds-p-md ds-border-b ds-border-subtle',
        children() {
          fdom.h3({
            className: 'ds-text-lg ds-font-semibold ds-text-primary ds-m-0',
            children: '组件分类',
          });
          fdom.p({
            className: 'ds-text-sm ds-text-secondary ds-m-0 ds-mt-xs',
            children: `共 ${categories.reduce(
              (sum, cat) => sum + cat.count,
              0
            )} 个组件`,
          });
        },
      });

      fdom.div({
        className: 'ds-p-sm ds-overflow-auto',
        s_flex: '1',
        children() {
          categories.forEach(category => {
            fdom.button({
              className: () =>
                `ds-nav-item ${
                  state.selectedCategory === category.id
                    ? 'ds-nav-item--active'
                    : ''
                }`,
              onClick: () => {
                state.selectedCategory = category.id;
              },
              children() {
                fdom.span({
                  className: 'ds-nav-item__icon',
                  children: category.icon,
                });
                fdom.div({
                  className: 'ds-flex ds-flex-col ds-items-start',
                  children() {
                    fdom.span({
                      className: 'ds-nav-item__text',
                      children: category.name,
                    });
                    fdom.span({
                      className: 'ds-text-xs ds-text-tertiary',
                      children: `${category.count} 个组件`,
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
}

function renderComponentArea(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-flex-1 ds-overflow-auto',
    children() {
      fdom.div({
        className: 'ds-p-lg',
        children() {
          renderOne(
            () => state.selectedCategory,
            function (category) {
              switch (category) {
                case 'buttons':
                  renderButtonShowcase(state);
                  break;
                case 'inputs':
                  renderInputShowcase(state);
                  break;
                case 'cards':
                  renderCardShowcase(state);
                  break;
                case 'navigation':
                  renderNavigationShowcase(state);
                  break;
                case 'feedback':
                  renderFeedbackShowcase(state);
                  break;
                case 'data':
                  renderDataShowcase(state);
                  break;
                case 'layout':
                  renderLayoutShowcase(state);
                  break;
                case 'overlays':
                  renderOverlayShowcase(state);
                  break;
                case 'advanced':
                  renderAdvancedShowcase(state);
                  break;
                default:
                  renderButtonShowcase(state);
              }
            }
          );
        },
      });
    },
  });
}
function renderShowcaseGroup(
  title: string,
  description: string,
  renderContent: () => void
) {
  fdom.div({
    className: 'ds-mb-xl',
    children() {
      fdom.div({
        className: 'ds-mb-md',
        children() {
          fdom.h3({
            className: 'ds-text-lg ds-font-semibold ds-text-primary ds-m-0',
            children: title,
          });
          if (description) {
            fdom.p({
              className: 'ds-text-sm ds-text-secondary ds-m-0 ds-mt-xs',
              children: description,
            });
          }
        },
      });
      fdom.div({
        className: 'ds-showcase-group__content',
        children: renderContent,
      });
    },
  });
}

function renderButtonShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({
        className: 'ds-showcase-title',
        children: '🔘 按钮组件',
      });

      // 基础按钮
      renderShowcaseGroup('基础按钮', '不同样式的基础按钮组件', () => {
        fdom.div({
          className: 'ds-showcase-grid',
          children() {
            fdom.button({
              className: 'ds-button ds-button--primary',
              children: 'Primary Button',
            });
            fdom.button({
              className: 'ds-button ds-button--secondary',
              children: 'Secondary Button',
            });
            fdom.button({
              className: 'ds-button ds-button--tertiary',
              children: 'Tertiary Button',
            });
            fdom.button({
              className: 'ds-button ds-button--ghost',
              children: 'Ghost Button',
            });
          },
        });
      });

      // 状态按钮
      renderShowcaseGroup('状态按钮', '表示不同状态和操作结果的按钮', () => {
        fdom.div({
          className: 'ds-showcase-grid',
          children() {
            fdom.button({
              className: 'ds-button ds-button--success',
              children: '✓ Success',
            });
            fdom.button({
              className: 'ds-button ds-button--warning',
              children: '⚠ Warning',
            });
            fdom.button({
              className: 'ds-button ds-button--danger',
              children: '✗ Danger',
            });
            fdom.button({
              className: 'ds-button ds-button--primary',
              disabled: true,
              children: 'Disabled',
            });
          },
        });
      });

      // 尺寸变体
      renderShowcaseGroup('尺寸变体', '不同尺寸的按钮适用于不同场景', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            fdom.button({
              className: 'ds-button ds-button--primary ds-button--sm',
              children: 'Small',
            });
            fdom.button({
              className: 'ds-button ds-button--primary',
              children: 'Medium',
            });
            fdom.button({
              className: 'ds-button ds-button--primary ds-button--lg',
              children: 'Large',
            });
          },
        });
      });

      // 图标按钮
      renderShowcaseGroup('图标按钮', '带图标的按钮和纯图标按钮', () => {
        fdom.div({
          className: 'ds-showcase-grid',
          children() {
            fdom.button({
              className: 'ds-button ds-button--primary',
              children() {
                fdom.span({ children: '📁' });
                fdom.span({ children: '打开文件' });
              },
            });
            fdom.button({
              className: 'ds-button ds-button--secondary',
              children() {
                fdom.span({ children: '💾' });
                fdom.span({ children: '保存' });
              },
            });
            fdom.button({
              className: 'ds-icon-button ds-icon-button--primary',
              title: '设置',
              children: '⚙️',
            });
            fdom.button({
              className: 'ds-icon-button ds-icon-button--secondary',
              title: '搜索',
              children: '🔍',
            });
          },
        });
      });

      // 按钮组
      renderShowcaseGroup('按钮组', '相关按钮的组合使用', () => {
        fdom.div({
          className: 'ds-flex ds-gap-xs',
          children() {
            fdom.button({
              className: 'ds-button ds-button--primary',
              children: '确认',
            });
            fdom.button({
              className: 'ds-button ds-button--ghost',
              children: '取消',
            });
          },
        });
      });
    },
  });
}
function renderInputShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({
        className: 'ds-showcase-title',
        children: '📝 输入组件',
      });

      // 基础输入框
      renderShowcaseGroup('基础输入框', '各种类型的输入框组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-showcase-grid--vertical',
          children() {
            fdom.div({
              className: 'ds-space-y-sm',
              children() {
                fdom.label({
                  className: 'ds-text-sm ds-font-medium ds-text-primary',
                  children: '文本输入',
                });
                fdom.input({
                  type: 'text',
                  placeholder: '请输入文本...',
                  className: 'ds-input',
                });
              },
            });
            fdom.div({
              className: 'ds-space-y-sm',
              children() {
                fdom.label({
                  className: 'ds-text-sm ds-font-medium ds-text-primary',
                  children: '邮箱输入',
                });
                fdom.input({
                  type: 'email',
                  placeholder: 'user@example.com',
                  className: 'ds-input',
                });
              },
            });
            fdom.div({
              className: 'ds-space-y-sm',
              children() {
                fdom.label({
                  className: 'ds-text-sm ds-font-medium ds-text-primary',
                  children: '密码输入',
                });
                fdom.input({
                  type: 'password',
                  placeholder: '请输入密码...',
                  className: 'ds-input',
                });
              },
            });
          },
        });
      });

      // 输入框状态
      renderShowcaseGroup('输入框状态', '不同状态下的输入框样式', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-showcase-grid--vertical',
          children() {
            fdom.input({
              type: 'text',
              value: '正常状态',
              className: 'ds-input',
            });
            fdom.input({
              type: 'text',
              value: '错误状态',
              className: 'ds-input ds-input--error',
            });
            fdom.input({
              type: 'text',
              value: '禁用状态',
              className: 'ds-input',
              disabled: true,
            });
          },
        });
      });

      // 文本域和代码编辑器
      renderShowcaseGroup('文本域', '多行文本输入和代码编辑器', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-showcase-grid--vertical',
          children() {
            fdom.textarea({
              placeholder: '请输入多行文本...',
              className: 'ds-textarea',
              s_height: '100px',
            });
            fdom.textarea({
              placeholder:
                '// 代码编辑器样式\nfunction hello() {\n  console.log("Hello World!");\n}',
              className: 'ds-code-editor',
              s_height: '120px',
            });
          },
        });
      });

      // 选择器和复选框
      renderShowcaseGroup('选择器', '下拉选择和复选框组件', () => {
        fdom.div({
          className: 'ds-showcase-grid',
          children() {
            fdom.div({
              className: 'ds-space-y-sm',
              children() {
                fdom.label({
                  className: 'ds-text-sm ds-font-medium ds-text-primary',
                  children: '下拉选择',
                });
                fdom.select({
                  className: 'ds-select',
                  children() {
                    fdom.option({ value: '', children: '请选择...' });
                    fdom.option({ value: '1', children: '选项 1' });
                    fdom.option({ value: '2', children: '选项 2' });
                    fdom.option({ value: '3', children: '选项 3' });
                  },
                });
              },
            });
            fdom.div({
              className: 'ds-space-y-sm',
              children() {
                fdom.label({
                  className: 'ds-text-sm ds-font-medium ds-text-primary',
                  children: '复选框组',
                });
                fdom.div({
                  className: 'ds-checkbox-group',
                  children() {
                    fdom.label({
                      className: 'ds-checkbox',
                      children() {
                        fdom.input({ type: 'checkbox' });
                        fdom.span({ children: '选项 A' });
                      },
                    });
                    fdom.label({
                      className: 'ds-checkbox',
                      children() {
                        fdom.input({ type: 'checkbox', checked: true });
                        fdom.span({ children: '选项 B (已选中)' });
                      },
                    });
                    fdom.label({
                      className: 'ds-checkbox',
                      children() {
                        fdom.input({ type: 'checkbox' });
                        fdom.span({ children: '选项 C' });
                      },
                    });
                  },
                });
              },
            });
          },
        });
      });

      // 单选框
      renderShowcaseGroup('单选框', '单选按钮组件', () => {
        fdom.div({
          className: 'ds-radio-group',
          children() {
            fdom.label({
              className: 'ds-radio',
              children() {
                fdom.input({ type: 'radio', name: 'demo-radio', value: '1' });
                fdom.span({ children: '选项 1' });
              },
            });
            fdom.label({
              className: 'ds-radio',
              children() {
                fdom.input({
                  type: 'radio',
                  name: 'demo-radio',
                  value: '2',
                  checked: true,
                });
                fdom.span({ children: '选项 2 (已选中)' });
              },
            });
            fdom.label({
              className: 'ds-radio',
              children() {
                fdom.input({ type: 'radio', name: 'demo-radio', value: '3' });
                fdom.span({ children: '选项 3' });
              },
            });
          },
        });
      });
    },
  });
}
function renderAdvancedShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({
        className: 'ds-showcase-title',
        children: '⚡ 高级组件',
      });

      // 开关组件
      renderShowcaseGroup('开关组件', '切换开关状态的组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            fdom.div({
              className: 'ds-flex ds-items-center ds-gap-sm',
              children() {
                fdom.label({
                  className: 'ds-switch',
                  children() {
                    fdom.input({ type: 'checkbox' });
                    fdom.span({ className: 'ds-switch__slider' });
                  },
                });
                fdom.span({ className: 'ds-text-sm', children: '关闭状态' });
              },
            });
            fdom.div({
              className: 'ds-flex ds-items-center ds-gap-sm',
              children() {
                fdom.label({
                  className: 'ds-switch',
                  children() {
                    fdom.input({ type: 'checkbox', checked: true });
                    fdom.span({ className: 'ds-switch__slider' });
                  },
                });
                fdom.span({ className: 'ds-text-sm', children: '开启状态' });
              },
            });
          },
        });
      });

      // 标签组件
      renderShowcaseGroup('标签组件', '用于标记和分类的标签', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            fdom.span({ className: 'ds-tag', children: '默认标签' });
            fdom.span({
              className: 'ds-tag ds-tag--primary',
              children: 'Primary',
            });
            fdom.span({
              className: 'ds-tag ds-tag--secondary',
              children: 'Secondary',
            });
            fdom.span({
              className: 'ds-tag ds-tag--success',
              children: 'Success',
            });
            fdom.span({
              className: 'ds-tag ds-tag--warning',
              children: 'Warning',
            });
            fdom.span({ className: 'ds-tag ds-tag--error', children: 'Error' });
            fdom.span({
              className: 'ds-tag ds-tag--primary',
              children() {
                fdom.span({ children: '可关闭' });
                fdom.button({ className: 'ds-tag__close', children: '×' });
              },
            });
          },
        });
      });

      // 头像组件
      renderShowcaseGroup('头像组件', '用户头像显示组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            fdom.div({ className: 'ds-avatar ds-avatar--sm', children: 'S' });
            fdom.div({ className: 'ds-avatar ds-avatar--md', children: 'M' });
            fdom.div({ className: 'ds-avatar ds-avatar--lg', children: 'L' });
            fdom.div({
              className: 'ds-avatar ds-avatar--md ds-avatar--online',
              children: '在线',
            });
          },
        });
      });

      // 评分组件
      renderShowcaseGroup('评分组件', '星级评分显示组件', () => {
        fdom.div({
          className: 'ds-space-y-sm',
          children() {
            fdom.div({
              className: 'ds-flex ds-items-center ds-gap-sm',
              children() {
                fdom.div({
                  className: 'ds-rating',
                  children() {
                    for (let i = 1; i <= 5; i++) {
                      fdom.span({
                        className: `ds-rating__star ${
                          i <= 4 ? 'ds-rating__star--filled' : ''
                        }`,
                        children: '★',
                      });
                    }
                  },
                });
                fdom.span({
                  className: 'ds-text-sm ds-text-secondary',
                  children: '4.0 分',
                });
              },
            });
            fdom.div({
              className: 'ds-flex ds-items-center ds-gap-sm',
              children() {
                fdom.div({
                  className: 'ds-rating',
                  children() {
                    for (let i = 1; i <= 5; i++) {
                      fdom.span({
                        className: `ds-rating__star ${
                          i <= 2 ? 'ds-rating__star--filled' : ''
                        }`,
                        children: '★',
                      });
                    }
                  },
                });
                fdom.span({
                  className: 'ds-text-sm ds-text-secondary',
                  children: '2.0 分',
                });
              },
            });
          },
        });
      });

      // 骨架屏
      renderShowcaseGroup('骨架屏', '内容加载时的占位符', () => {
        fdom.div({
          className: 'ds-space-y-md',
          children() {
            fdom.div({ className: 'ds-skeleton ds-skeleton--title' });
            fdom.div({ className: 'ds-skeleton ds-skeleton--text' });
            fdom.div({
              className: 'ds-skeleton ds-skeleton--text',
              s_width: '80%',
            });
            fdom.div({
              className: 'ds-flex ds-items-center ds-gap-sm ds-mt-md',
              children() {
                fdom.div({ className: 'ds-skeleton ds-skeleton--avatar' });
                fdom.div({ className: 'ds-skeleton ds-skeleton--button' });
              },
            });
          },
        });
      });

      // 加载状态
      renderShowcaseGroup('加载状态', '各种加载指示器', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            fdom.div({
              className: 'ds-loading',
              children() {
                fdom.div({ className: 'ds-loading__spinner' });
                fdom.span({
                  className: 'ds-loading__text',
                  children: '加载中...',
                });
              },
            });
            fdom.div({
              className: 'ds-loading ds-loading--lg',
              children() {
                fdom.div({ className: 'ds-loading__spinner' });
                fdom.span({
                  className: 'ds-loading__text',
                  children: '大尺寸加载',
                });
              },
            });
            fdom.div({
              className: 'ds-text-2xl',
              children: '⏳',
            });
          },
        });
      });

      // 空状态
      renderShowcaseGroup('空状态', '无数据时的占位显示', () => {
        fdom.div({
          className: 'ds-empty',
          s_height: '200px',
          children() {
            fdom.div({ className: 'ds-empty__icon', children: '📭' });
            fdom.h3({ className: 'ds-empty__title', children: '暂无数据' });
            fdom.p({
              className: 'ds-empty__description',
              children: '当前没有任何数据，您可以创建一些内容。',
            });
            fdom.div({
              className: 'ds-empty__action',
              children() {
                fdom.button({
                  className: 'ds-button ds-button--primary',
                  children: '创建内容',
                });
              },
            });
          },
        });
      });

      // 类型卡片组件
      renderShowcaseGroup('类型卡片', '用于显示类型信息的卡片组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-showcase-grid--cards',
          children() {
            renderTypeCard({
              title: 'String',
              description: '字符串类型的扩展功能',
              count: 12,
              variant: 'primary',
              onClick() {
                console.log('String type clicked');
              },
            });
            renderTypeCard({
              title: 'Number',
              description: '数字类型的扩展功能',
              count: 8,
              variant: 'secondary',
              onClick() {
                console.log('Number type clicked');
              },
            });
            renderTypeCard({
              title: 'Object',
              description: '对象类型的扩展功能',
              count: 15,
              variant: 'tertiary',
              onClick() {
                console.log('Object type clicked');
              },
            });
          },
        });
      });

      // 颜色选择器标签
      renderShowcaseGroup('颜色选择器', '颜色选择器标签组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            renderColorPickerLabel({
              color: '#6750a4',
              onChange(color) {
                console.log('Color changed:', color);
              },
            });
            renderColorPickerLabel({
              color: '#1976d2',
              onChange(color) {
                console.log('Color changed:', color);
              },
            });
            renderColorPickerLabel({
              color: '#388e3c',
              onChange(color) {
                console.log('Color changed:', color);
              },
            });
            renderColorPickerLabel({
              color: '#f57c00',
              onChange(color) {
                console.log('Color changed:', color);
              },
            });
          },
        });
      });

      // 状态指示器
      renderShowcaseGroup('状态指示器', '显示不同状态的指示器组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            renderStatusIndicator({
              status: 'success',
              label: '运行成功',
            });
            renderStatusIndicator({
              status: 'warning',
              label: '警告信息',
            });
            renderStatusIndicator({
              status: 'error',
              label: '错误状态',
            });
            renderStatusIndicator({
              status: 'info',
              label: '信息提示',
            });
          },
        });
      });
    },
  });
}
// 其他展示函数的简化实现
function renderCardShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({ className: 'ds-showcase-title', children: '🃏 卡片组件' });

      renderShowcaseGroup('基础卡片', '不同样式的卡片组件', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-showcase-grid--cards',
          children() {
            fdom.div({
              className: 'ds-card',
              children() {
                fdom.h4({ className: 'ds-card__title', children: '基础卡片' });
                fdom.p({
                  className: 'ds-card__subtitle',
                  children: '这是一个基础的卡片组件',
                });
                fdom.div({
                  className: 'ds-card__body',
                  children: '卡片内容区域，可以放置任何内容。',
                });
              },
            });
            fdom.div({
              className: 'ds-card ds-card--elevated',
              children() {
                fdom.h4({ className: 'ds-card__title', children: '浮起卡片' });
                fdom.p({
                  className: 'ds-card__subtitle',
                  children: '带有阴影效果的卡片',
                });
                fdom.div({
                  className: 'ds-card__body',
                  children: '这个卡片有更明显的阴影效果。',
                });
              },
            });
          },
        });
      });
    },
  });
}

function renderNavigationShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({ className: 'ds-showcase-title', children: '🧭 导航组件' });

      renderShowcaseGroup('导航项', '侧边栏导航组件', () => {
        fdom.div({
          className: 'ds-nav-list',
          s_maxWidth: '200px',
          children() {
            fdom.button({
              className: 'ds-nav-item ds-nav-item--active',
              children() {
                fdom.span({ className: 'ds-nav-item__icon', children: '🏠' });
                fdom.span({ className: 'ds-nav-item__text', children: '首页' });
              },
            });
            fdom.button({
              className: 'ds-nav-item',
              children() {
                fdom.span({ className: 'ds-nav-item__icon', children: '📊' });
                fdom.span({ className: 'ds-nav-item__text', children: '数据' });
              },
            });
            fdom.button({
              className: 'ds-nav-item',
              children() {
                fdom.span({ className: 'ds-nav-item__icon', children: '⚙️' });
                fdom.span({ className: 'ds-nav-item__text', children: '设置' });
              },
            });
          },
        });
      });

      renderShowcaseGroup('面包屑导航', '页面层级导航', () => {
        fdom.div({
          className: 'ds-breadcrumb',
          children() {
            fdom.span({ className: 'ds-breadcrumb__item', children: '首页' });
            fdom.span({ className: 'ds-breadcrumb__separator', children: '/' });
            fdom.span({ className: 'ds-breadcrumb__item', children: '组件' });
            fdom.span({ className: 'ds-breadcrumb__separator', children: '/' });
            fdom.span({
              className: 'ds-breadcrumb__item ds-breadcrumb__item--current',
              children: '导航',
            });
          },
        });
      });

      renderShowcaseGroup('标签页', '内容切换标签', () => {
        fdom.div({
          className: 'ds-tabs',
          children() {
            fdom.div({
              className: 'ds-tabs__list',
              children() {
                fdom.button({
                  className: 'ds-tab ds-tab--active',
                  children: '标签 1',
                });
                fdom.button({ className: 'ds-tab', children: '标签 2' });
                fdom.button({ className: 'ds-tab', children: '标签 3' });
              },
            });
            fdom.div({
              className: 'ds-tabs__content',
              children: '标签 1 的内容区域',
            });
          },
        });
      });
    },
  });
}

function renderFeedbackShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({ className: 'ds-showcase-title', children: '💬 反馈组件' });

      renderShowcaseGroup('通知组件', '系统消息通知', () => {
        fdom.div({
          className: 'ds-space-y-md',
          children() {
            fdom.div({
              className: 'ds-notification',
              children() {
                fdom.div({
                  className: 'ds-notification__icon',
                  children: 'ℹ️',
                });
                fdom.div({
                  className: 'ds-notification__content',
                  children() {
                    fdom.h4({
                      className: 'ds-notification__title',
                      children: '信息通知',
                    });
                    fdom.p({
                      className: 'ds-notification__message',
                      children: '这是一个普通的信息通知。',
                    });
                  },
                });
                fdom.button({
                  className: 'ds-notification__close',
                  children: '×',
                });
              },
            });
            fdom.div({
              className: 'ds-notification ds-notification--success',
              children() {
                fdom.div({
                  className: 'ds-notification__icon',
                  children: '✅',
                });
                fdom.div({
                  className: 'ds-notification__content',
                  children() {
                    fdom.h4({
                      className: 'ds-notification__title',
                      children: '操作成功',
                    });
                    fdom.p({
                      className: 'ds-notification__message',
                      children: '您的操作已成功完成。',
                    });
                  },
                });
                fdom.button({
                  className: 'ds-notification__close',
                  children: '×',
                });
              },
            });
          },
        });
      });

      renderShowcaseGroup('徽章', '状态标识徽章', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-items-center',
          children() {
            fdom.span({
              className: 'ds-badge ds-badge--primary',
              children: 'Primary',
            });
            fdom.span({
              className: 'ds-badge ds-badge--success',
              children: 'Success',
            });
            fdom.span({
              className: 'ds-badge ds-badge--warning',
              children: 'Warning',
            });
            fdom.span({
              className: 'ds-badge ds-badge--error',
              children: 'Error',
            });
          },
        });
      });

      renderShowcaseGroup('提示框', '不同类型的提示信息', () => {
        fdom.div({
          className: 'ds-space-y-md',
          children() {
            fdom.div({
              className: 'ds-alert ds-alert--info',
              children() {
                fdom.span({ className: 'ds-alert__icon', children: 'ℹ️' });
                fdom.span({
                  className: 'ds-alert__text',
                  children: '这是一个信息提示',
                });
              },
            });
            fdom.div({
              className: 'ds-alert ds-alert--success',
              children() {
                fdom.span({ className: 'ds-alert__icon', children: '✅' });
                fdom.span({
                  className: 'ds-alert__text',
                  children: '操作成功完成',
                });
              },
            });
            fdom.div({
              className: 'ds-alert ds-alert--warning',
              children() {
                fdom.span({ className: 'ds-alert__icon', children: '⚠️' });
                fdom.span({
                  className: 'ds-alert__text',
                  children: '请注意这个警告',
                });
              },
            });
            fdom.div({
              className: 'ds-alert ds-alert--error',
              children() {
                fdom.span({ className: 'ds-alert__icon', children: '❌' });
                fdom.span({
                  className: 'ds-alert__text',
                  children: '发生了一个错误',
                });
              },
            });
          },
        });
      });

      renderShowcaseGroup('进度指示器', '进度条和加载指示器', () => {
        fdom.div({
          className: 'ds-space-y-md',
          children() {
            fdom.div({
              className: 'ds-progress',
              children() {
                fdom.div({ className: 'ds-progress__bar', s_width: '60%' });
              },
            });
            fdom.div({
              className: 'ds-progress ds-progress--success',
              children() {
                fdom.div({ className: 'ds-progress__bar', s_width: '100%' });
              },
            });
          },
        });
      });
    },
  });
}
function renderDataShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({ className: 'ds-showcase-title', children: '📊 数据展示' });

      renderShowcaseGroup('表格', '数据表格展示', () => {
        fdom.table({
          className: 'ds-table',
          children() {
            fdom.thead({
              children() {
                fdom.tr({
                  children() {
                    fdom.th({ children: '姓名' });
                    fdom.th({ children: '职位' });
                    fdom.th({ children: '状态' });
                    fdom.th({ children: '操作' });
                  },
                });
              },
            });
            fdom.tbody({
              children() {
                fdom.tr({
                  children() {
                    fdom.td({ children: '张三' });
                    fdom.td({ children: '前端开发' });
                    fdom.td({
                      children() {
                        fdom.span({
                          className: 'ds-badge ds-badge--success',
                          children: '在线',
                        });
                      },
                    });
                    fdom.td({
                      children() {
                        fdom.button({
                          className: 'ds-button ds-button--sm ds-button--ghost',
                          children: '编辑',
                        });
                      },
                    });
                  },
                });
                fdom.tr({
                  children() {
                    fdom.td({ children: '李四' });
                    fdom.td({ children: '后端开发' });
                    fdom.td({
                      children() {
                        fdom.span({
                          className: 'ds-badge ds-badge--warning',
                          children: '忙碌',
                        });
                      },
                    });
                    fdom.td({
                      children() {
                        fdom.button({
                          className: 'ds-button ds-button--sm ds-button--ghost',
                          children: '编辑',
                        });
                      },
                    });
                  },
                });
              },
            });
          },
        });
      });

      renderShowcaseGroup('统计卡片', '数据统计展示卡片', () => {
        fdom.div({
          className: 'ds-showcase-grid ds-showcase-grid--stats',
          children() {
            fdom.div({
              className: 'ds-stat-card',
              children() {
                fdom.div({ className: 'ds-stat-card__icon', children: '👥' });
                fdom.div({
                  className: 'ds-stat-card__value',
                  children: '1,234',
                });
                fdom.div({
                  className: 'ds-stat-card__label',
                  children: '用户总数',
                });
              },
            });
            fdom.div({
              className: 'ds-stat-card',
              children() {
                fdom.div({ className: 'ds-stat-card__icon', children: '📈' });
                fdom.div({
                  className: 'ds-stat-card__value',
                  children: '+12%',
                });
                fdom.div({
                  className: 'ds-stat-card__label',
                  children: '增长率',
                });
              },
            });
            fdom.div({
              className: 'ds-stat-card',
              children() {
                fdom.div({ className: 'ds-stat-card__icon', children: '💰' });
                fdom.div({
                  className: 'ds-stat-card__value',
                  children: '¥56,789',
                });
                fdom.div({
                  className: 'ds-stat-card__label',
                  children: '总收入',
                });
              },
            });
          },
        });
      });

      renderShowcaseGroup('代码块', '代码展示组件', () => {
        fdom.div({
          className: 'ds-code-block',
          children() {
            fdom.div({
              className: 'ds-code-block__header',
              children() {
                fdom.span({
                  className: 'ds-code-block__title',
                  children: 'example.ts',
                });
                fdom.button({
                  className: 'ds-code-block__copy',
                  children: '📋',
                });
              },
            });
            fdom.div({
              className: 'ds-code-block__content',
              children: `const theme = generateThemeGradient('#6750a4', {
  style: 'analogous',
  steps: 3
})`,
            });
          },
        });
      });
    },
  });
}

function renderLayoutShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({ className: 'ds-showcase-title', children: '📐 布局组件' });

      renderShowcaseGroup('网格布局', '响应式网格系统', () => {
        fdom.div({
          className: 'ds-grid ds-grid--cols-3 ds-gap-md',
          children() {
            for (let i = 1; i <= 6; i++) {
              fdom.div({
                className:
                  'ds-p-md ds-bg-surface-container ds-rounded ds-text-center',
                children: `网格项 ${i}`,
              });
            }
          },
        });
      });

      renderShowcaseGroup('弹性布局', 'Flexbox 布局示例', () => {
        fdom.div({
          className:
            'ds-flex ds-justify-between ds-items-center ds-p-md ds-bg-surface-container ds-rounded',
          children() {
            fdom.div({ children: '左侧内容' });
            fdom.div({ children: '中间内容' });
            fdom.div({ children: '右侧内容' });
          },
        });
      });
    },
  });
}

function renderOverlayShowcase(state: ComponentShowcaseState) {
  fdom.div({
    className: 'ds-showcase-section',
    children() {
      fdom.h2({ className: 'ds-showcase-title', children: '🎭 浮层组件' });

      renderShowcaseGroup('下拉菜单', '下拉选择菜单', () => {
        fdom.div({
          className: 'ds-dropdown',
          children() {
            fdom.button({
              className: 'ds-button ds-button--secondary',
              children: '下拉菜单 ▼',
            });
            fdom.div({
              className: 'ds-dropdown__menu',
              s_position: 'static',
              s_opacity: '1',
              s_pointerEvents: 'auto',
              children() {
                fdom.button({
                  className: 'ds-dropdown__item',
                  children: '菜单项 1',
                });
                fdom.button({
                  className: 'ds-dropdown__item',
                  children: '菜单项 2',
                });
                fdom.hr({ className: 'ds-dropdown__divider' });
                fdom.button({
                  className: 'ds-dropdown__item',
                  children: '菜单项 3',
                });
              },
            });
          },
        });
      });

      renderShowcaseGroup('模态框预览', '模态对话框组件', () => {
        fdom.div({
          className: 'ds-modal',
          s_position: 'static',
          s_maxWidth: '400px',
          children() {
            fdom.div({
              className: 'ds-modal__header',
              children() {
                fdom.h3({
                  className: 'ds-modal__title',
                  children: '模态框标题',
                });
                fdom.button({ className: 'ds-modal__close', children: '×' });
              },
            });
            fdom.div({
              className: 'ds-modal__body',
              children: '这是模态框的内容区域。',
            });
            fdom.div({
              className: 'ds-modal__footer',
              children() {
                fdom.button({
                  className: 'ds-button ds-button--primary',
                  children: '确认',
                });
                fdom.button({
                  className: 'ds-button ds-button--ghost',
                  children: '取消',
                });
              },
            });
          },
        });
      });
    },
  });
}
