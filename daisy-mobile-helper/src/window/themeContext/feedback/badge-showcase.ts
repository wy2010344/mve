import { fdom } from 'mve-dom';
import { Badge } from './index';

export default function BadgeShowcase() {
  fdom.div({
    className: 'space-y-6',
    children() {
      // 不同颜色
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '不同颜色',
          });
          fdom.div({
            className: 'flex flex-wrap gap-3',
            children() {
              Badge({ variant: 'primary', children: 'Primary' });
              Badge({ variant: 'success', children: 'Success' });
              Badge({ variant: 'warning', children: 'Warning' });
              Badge({ variant: 'error', children: 'Error' });
              Badge({ variant: 'secondary', children: 'Secondary' });
            },
          });
        },
      });

      // 不同尺寸
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '不同尺寸',
          });
          fdom.div({
            className: 'flex items-center gap-3',
            children() {
              Badge({ size: 'sm', children: 'Small' });
              Badge({ size: 'md', children: 'Medium' });
              Badge({ size: 'lg', children: 'Large' });
            },
          });
        },
      });

      // 使用场景
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '使用场景',
          });
          fdom.div({
            className: 'space-y-3',
            children() {
              fdom.div({
                className: 'flex items-center gap-2',
                children() {
                  fdom.span({
                    className: 'text-sm',
                    children: '状态标记：',
                  });
                  Badge({ variant: 'success', size: 'sm', children: 'Active' });
                  Badge({ variant: 'warning', size: 'sm', children: 'Pending' });
                  Badge({ variant: 'error', size: 'sm', children: 'Inactive' });
                },
              });

              fdom.div({
                className: 'flex items-center gap-2',
                children() {
                  fdom.span({
                    className: 'text-sm',
                    children: '数字提示：',
                  });
                  Badge({ variant: 'error', size: 'sm', children: '99+' });
                  Badge({ variant: 'primary', size: 'sm', children: '5' });
                },
              });

              fdom.div({
                className: 'flex items-center gap-2',
                children() {
                  fdom.span({
                    className: 'text-sm',
                    children: '标签分类：',
                  });
                  Badge({ variant: 'secondary', size: 'sm', children: 'React' });
                  Badge({ variant: 'secondary', size: 'sm', children: 'TypeScript' });
                  Badge({ variant: 'secondary', size: 'sm', children: 'CSS' });
                },
              });
            },
          });
        },
      });
    },
  });
}
