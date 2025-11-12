import { fdom } from 'mve-dom';
import { Card } from './index';
import { Button } from '../button';
import { Grid, Flex } from '../layout';

export default function CardShowcase() {
  Grid({
    cols: 3,
    gap: 'lg',
    children() {
      // 基础卡片
      Card({
        title: '基础卡片',
        subtitle: '这是一个基础卡片',
        children() {
          fdom.p({
            children: '卡片内容区域，可以放置任何内容。',
          });
        },
      });

      // 可悬停卡片
      Card({
        title: '可悬停卡片',
        subtitle: '鼠标悬停有效果',
        hoverable: true,
        children() {
          fdom.p({
            children: '这个卡片支持悬停效果。',
          });
        },
      });

      // 带底部的卡片
      Card({
        title: '带操作卡片',
        subtitle: '包含底部操作区域',
        children() {
          fdom.p({
            children: '这个卡片包含底部操作按钮。',
          });
        },
        footer() {
          Flex({
            justify: 'end',
            gap: 'sm',
            children() {
              Button({ variant: 'ghost', size: 'sm', children: '取消' });
              Button({ variant: 'primary', size: 'sm', children: '确认' });
            },
          });
        },
      });

      // 不同变体的卡片
      Card({
        title: '高级卡片',
        subtitle: '带阴影效果',
        variant: 'elevated',
        children() {
          fdom.p({
            children: '这个卡片有更明显的阴影效果。',
          });
        },
      });

      Card({
        title: '边框卡片',
        subtitle: '突出边框样式',
        variant: 'outlined',
        children() {
          fdom.p({
            children: '这个卡片使用边框样式。',
          });
        },
      });
    },
  });
}
