import { fdom } from 'mve-dom';
import { card } from 'wy-dom-helper/window-theme';
import { hookTheme } from '../util';
export interface CardProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'elevated' | 'outlined';
  hoverable?: boolean;
  className?: string;
  onClick?: (event: MouseEvent) => void;
  children?: () => void;
  footer?: () => void;
}

export function Card(props: CardProps = {}) {
  const {
    title,
    subtitle,
    variant = 'default',
    hoverable = false,
    className = '',
    onClick,
    children,
    footer,
  } = props;
  const getCls = hookTheme(card);
  fdom.div({
    className() {
      return getCls('card', {
        variant,
        hoverable,
        className,
      });
    },

    onClick,

    children() {
      // 卡片头部
      if (title || subtitle) {
        fdom.div({
          className() {
            return getCls('header', {});
          },
          children() {
            if (title) {
              fdom.h3({
                className() {
                  return getCls('title', {});
                },
                children: title,
              });
            }

            if (subtitle) {
              fdom.p({
                className() {
                  return getCls('subtitle', {});
                },
                children: subtitle,
              });
            }
          },
        });
      }

      // 卡片内容
      if (children) {
        fdom.div({
          className() {
            return getCls('body', {});
          },
          children,
        });
      }

      // 卡片底部
      if (footer) {
        fdom.div({
          className() {
            return getCls('footer', {});
          },
          children: footer,
        });
      }
    },
  });
}
// 导出 showcase
