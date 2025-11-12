import { fdom } from 'mve-dom';
import { Progress } from './index';
import { createSignal } from 'wy-helper';
import { Button } from '../button';

export default function ProgressShowcase() {
  fdom.div({
    className: 'space-y-6',
    children() {
      // 基础用法
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '基础用法',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '30%',
                  });
                  Progress({ value: 30 });
                },
              });
            },
          });
        },
      });

      // 不同颜色
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '不同颜色',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '默认 (50%)',
                  });
                  Progress({ value: 50, variant: 'default' });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '成功 (75%)',
                  });
                  Progress({ value: 75, variant: 'success' });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '警告 (50%)',
                  });
                  Progress({ value: 50, variant: 'warning' });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '错误 (25%)',
                  });
                  Progress({ value: 25, variant: 'error' });
                },
              });
            },
          });
        },
      });

      // 动态进度
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '动态进度',
          });

          const progressValue = createSignal(30);

          fdom.div({
            className: 'space-y-4',
            children() {
              // 控制按钮
              fdom.div({
                className: 'flex gap-2',
                children() {
                  Button({
                    size: 'sm',
                    children: '+10',
                    onClick: () => {
                      const current = progressValue.get();
                      progressValue.set(Math.min(100, current + 10));
                    },
                  });

                  Button({
                    size: 'sm',
                    children: '-10',
                    onClick: () => {
                      const current = progressValue.get();
                      progressValue.set(Math.max(0, current - 10));
                    },
                  });

                  Button({
                    size: 'sm',
                    variant: 'secondary',
                    children: '重置',
                    onClick: () => progressValue.set(30),
                  });

                  Button({
                    size: 'sm',
                    variant: 'success',
                    children: '完成',
                    onClick: () => progressValue.set(100),
                  });
                },
              });

              // 进度条
              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children() {
                      return `当前进度: ${progressValue.get()}%`;
                    },
                  });
                  Progress({ value: progressValue });
                },
              });
            },
          });
        },
      });

      // 不同进度状态
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '不同进度状态',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '未开始 (0%)',
                  });
                  Progress({ value: 0 });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '进行中 (45%)',
                  });
                  Progress({ value: 45 });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '已完成 (100%)',
                  });
                  Progress({ value: 100, variant: 'success' });
                },
              });
            },
          });
        },
      });
    },
  });
}
