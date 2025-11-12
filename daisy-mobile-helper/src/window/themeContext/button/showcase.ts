import { fdom } from 'mve-dom';
import { Button, IconButton } from './index';
import { Flex } from '../layout';
import { layout } from 'wy-dom-helper/window-theme';
import { hookTheme } from '../util';

function ShowcaseSection(title: string, children: () => void) {
  const getLayoutCls = hookTheme(layout);

  fdom.div({
    className() {
      return getLayoutCls('layout', {
        type: 'spacing',
        margin: 'md',
      });
    },
    children() {
      fdom.h3({
        className() {
          return getLayoutCls('layout', {
            type: 'text',
            size: 'lg',
            weight: 'semibold',
            margin: 'sm',
          });
        },
        children: title,
      });

      fdom.div({
        className() {
          return getLayoutCls('layout', {
            type: 'spacing',
            padding: 'md',
          });
        },
        s_background: '#f9fafb',
        s_borderRadius: '8px',
        s_border: '1px solid #e5e7eb',
        children,
      });
    },
  });
}

export default function ButtonShowcase() {
  const getLayoutCls = hookTheme(layout);
  fdom.div({
    className() {
      return getLayoutCls('layout', {
        type: 'flex',
        direction: 'col',
        gap: 'lg',
      });
    },
    children() {
      // 基础按钮
      ShowcaseSection('基础按钮', () => {
        Flex({
          wrap: true,
          gap: 'sm',
          children() {
            Button({ variant: 'primary', children: 'Primary' });
            Button({ variant: 'secondary', children: 'Secondary' });
            Button({ variant: 'tertiary', children: 'Tertiary' });
            Button({ variant: 'success', children: 'Success' });
            Button({ variant: 'warning', children: 'Warning' });
            Button({ variant: 'danger', children: 'Danger' });
            Button({ variant: 'ghost', children: 'Ghost' });
          },
        });
      });

      // 按钮尺寸
      ShowcaseSection('按钮尺寸', () => {
        Flex({
          items: 'center',
          gap: 'sm',
          children() {
            Button({ variant: 'primary', size: 'sm', children: 'Small' });
            Button({ variant: 'primary', size: 'md', children: 'Medium' });
            Button({ variant: 'primary', size: 'lg', children: 'Large' });
          },
        });
      });

      // 图标按钮
      ShowcaseSection('图标按钮', () => {
        Flex({
          gap: 'sm',
          children() {
            IconButton({ variant: 'primary', icon: '⚙️' });
            IconButton({ variant: 'secondary', icon: '🔍' });
            IconButton({ variant: 'primary', icon: '❤️' });
            IconButton({ variant: 'secondary', icon: '⭐' });
          },
        });
      });

      // 按钮状态
      ShowcaseSection('按钮状态', () => {
        Flex({
          gap: 'sm',
          children() {
            Button({ variant: 'primary', children: '正常状态' });
            Button({
              variant: 'primary',
              disabled: true,
              children: '禁用状态',
            });
          },
        });
      });
    },
  });
}
