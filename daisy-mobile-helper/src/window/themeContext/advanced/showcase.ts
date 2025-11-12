import { fdom } from 'mve-dom';
import { Switch, Tag, Avatar, Rating, Skeleton } from './index';
import { createSignal } from 'wy-helper';

export default function AdvancedShowcase() {
  // Switch 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Switch 开关',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          const switchValue = createSignal(true);

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '不同尺寸：',
              });
              Switch({ size: 'sm', checked: true });
              Switch({ size: 'md', checked: true });
              Switch({ size: 'lg', checked: true });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '交互式：',
              });
              Switch({
                checked: switchValue,
                onChange: value => {
                  console.log('Switch changed:', value);
                },
              });
              fdom.span({
                className: 'text-sm',
                children() {
                  return switchValue.get() ? '开启' : '关闭';
                },
              });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '禁用状态：',
              });
              Switch({ disabled: true, checked: false });
              Switch({ disabled: true, checked: true });
            },
          });
        },
      });
    },
  });

  // Tag 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Tag 标签',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            className: 'flex flex-wrap gap-2',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600 w-full mb-2',
                children: '不同颜色：',
              });
              Tag({ variant: 'default', children: 'Default' });
              Tag({ variant: 'primary', children: 'Primary' });
              Tag({ variant: 'secondary', children: 'Secondary' });
              Tag({ variant: 'success', children: 'Success' });
              Tag({ variant: 'warning', children: 'Warning' });
              Tag({ variant: 'error', children: 'Error' });
            },
          });

          fdom.div({
            className: 'flex flex-wrap gap-2',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600 w-full mb-2',
                children: '可关闭：',
              });
              Tag({
                variant: 'primary',
                closable: true,
                children: 'Closable Tag',
                onClose: () => console.log('Tag closed'),
              });
              Tag({
                variant: 'success',
                closable: true,
                children: 'Another Tag',
              });
            },
          });
        },
      });
    },
  });

  // Avatar 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Avatar 头像',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '不同尺寸：',
              });
              Avatar({ size: 'sm', children: 'S' });
              Avatar({ size: 'md', children: 'M' });
              Avatar({ size: 'lg', children: 'L' });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '在线状态：',
              });
              Avatar({ status: 'online', children: 'ON' });
              Avatar({ status: 'offline', children: 'OFF' });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '文字头像：',
              });
              Avatar({ children: 'A' });
              Avatar({ children: 'AB' });
              Avatar({ children: '张' });
            },
          });
        },
      });
    },
  });

  // Rating 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Rating 评分',
      });

      const ratingValue = createSignal(3);

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '不同尺寸：',
              });
              fdom.div({
                className: 'space-y-2',
                children() {
                  Rating({ size: 'sm', value: 4 });
                  Rating({ size: 'md', value: 4 });
                  Rating({ size: 'lg', value: 4 });
                },
              });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children() {
                  return `交互式评分 (${ratingValue.get()} 星)：`;
                },
              });
              Rating({
                value: ratingValue,
                onChange: value => {
                  console.log('Rating changed:', value);
                },
              });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '只读模式：',
              });
              Rating({ value: 5, readonly: true });
            },
          });
        },
      });
    },
  });

  // Skeleton 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Skeleton 骨架屏',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '标题骨架：',
              });
              Skeleton({ variant: 'title' });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '文本骨架：',
              });
              Skeleton({ variant: 'text' });
              Skeleton({ variant: 'text' });
              Skeleton({ variant: 'text' });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '头像骨架：',
                  });
                  Skeleton({ variant: 'avatar' });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '按钮骨架：',
                  });
                  Skeleton({ variant: 'button' });
                },
              });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '卡片骨架：',
              });
              Skeleton({ variant: 'card' });
            },
          });
        },
      });
    },
  });
}
