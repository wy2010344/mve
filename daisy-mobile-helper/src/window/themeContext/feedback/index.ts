import { fdom } from 'mve-dom';
import {
  notification,
  badge,
  alert,
  progress,
} from 'wy-dom-helper/window-theme';
import { hookTheme } from '../util';
import type { StoreRef } from 'wy-helper';
import { createSignal } from 'wy-helper';

// Notification 组件
export interface NotificationProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  icon?: string;
  title?: string;
  message: string;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Notification(props: NotificationProps) {
  const {
    variant = 'default',
    icon,
    title,
    message,
    closable = true,
    onClose,
    className = '',
  } = props;

  const getCls = hookTheme(notification);

  fdom.div({
    className() {
      return getCls('notification', { variant, className } as any);
    },
    children() {
      if (icon) {
        fdom.div({
          className() {
            return getCls('icon', {});
          },
          children: icon,
        });
      }

      fdom.div({
        className() {
          return getCls('content', {});
        },
        children() {
          if (title) {
            fdom.h4({
              className() {
                return getCls('title', {});
              },
              children: title,
            });
          }

          fdom.p({
            className() {
              return getCls('message', {});
            },
            children: message,
          });
        },
      });

      if (closable) {
        fdom.button({
          className() {
            return getCls('close', {});
          },
          children: '×',
          onClick: onClose,
        });
      }
    },
  });
}

// Badge 组件
export interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: string;
  className?: string;
}

export function Badge(props: BadgeProps) {
  const {
    variant = 'primary',
    size = 'md',
    children,
    className = '',
  } = props;

  const getCls = hookTheme(badge);

  fdom.span({
    className() {
      return getCls('badge', { variant, size, className } as any);
    },
    children,
  });
}

// Alert 组件
export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  children: string | (() => void);
  className?: string;
}

export function Alert(props: AlertProps) {
  const { variant = 'info', icon, children, className = '' } = props;

  const getCls = hookTheme(alert);

  fdom.div({
    className() {
      return getCls('alert', { variant, className } as any);
    },
    children() {
      if (icon) {
        fdom.div({
          className() {
            return getCls('alertIcon', {});
          },
          children: icon,
        });
      }

      fdom.div({
        className() {
          return getCls('alertText', {});
        },
        children,
      });
    },
  });
}

// Progress 组件
export interface ProgressProps {
  value: StoreRef<number> | number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function Progress(props: ProgressProps) {
  const { value, variant = 'default', className = '' } = props;

  const valueSignal =
    typeof value === 'number' ? createSignal(value) : value;

  const getCls = hookTheme(progress);

  fdom.div({
    className() {
      return getCls('progress', { variant, className } as any);
    },
    children() {
      fdom.div({
        className() {
          return getCls('bar', { variant } as any);
        },
        s_width() {
          return `${Math.min(100, Math.max(0, valueSignal.get()))}%`;
        },
      });
    },
  });
}
