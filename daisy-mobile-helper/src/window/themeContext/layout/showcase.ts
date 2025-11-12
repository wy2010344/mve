import { fdom } from 'mve-dom';
import { Button } from '../button';
import { Grid, Flex } from './index';
import { hookTheme } from '../util';
import { layout } from 'wy-dom-helper/window-theme';

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

export default function LayoutShowcase() {
  const getLayoutCls = hookTheme(layout);
  Flex({
    direction: 'col',
    gap: 'lg',
    children() {
      // 网格布局
      ShowcaseSection('网格布局', () => {
        Grid({
          cols: 4,
          gap: 'sm',
          children() {
            for (let i = 1; i <= 8; i++) {
              fdom.div({
                className() {
                  return getLayoutCls('layout', {
                    type: 'spacing',
                    padding: 'md',
                  });
                },
                s_background: '#f3f4f6',
                s_borderRadius: '8px',
                s_textAlign: 'center',
                children: `Grid ${i}`,
              });
            }
          },
        });
      });

      // Flex 布局
      ShowcaseSection('Flex 布局', () => {
        Flex({
          direction: 'col',
          gap: 'md',
          children() {
            // 水平居中
            Flex({
              justify: 'center',
              gap: 'sm',
              children() {
                Button({ variant: 'primary', size: 'sm', children: '居中1' });
                Button({ variant: 'secondary', size: 'sm', children: '居中2' });
                Button({ variant: 'tertiary', size: 'sm', children: '居中3' });
              },
            });

            // 两端对齐
            Flex({
              justify: 'between',
              items: 'center',
              children() {
                fdom.span({ children: '左侧内容' });
                Button({
                  variant: 'primary',
                  size: 'sm',
                  children: '右侧按钮',
                });
              },
            });

            // 垂直布局
            Flex({
              direction: 'col',
              items: 'center',
              gap: 'sm',
              children() {
                Button({ variant: 'primary', size: 'sm', children: '垂直1' });
                Button({ variant: 'secondary', size: 'sm', children: '垂直2' });
                Button({ variant: 'tertiary', size: 'sm', children: '垂直3' });
              },
            });
          },
        });
      });
    },
  });
}
