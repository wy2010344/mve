import { fdom } from 'mve-dom';
import {
  switchComponent,
  tag,
  avatar,
  rating,
  skeleton,
} from 'wy-dom-helper/window-theme';
import { hookTheme } from '../util';
import type { StoreRef } from 'wy-helper';
import { createSignal } from 'wy-helper';

// Switch 组件
export interface SwitchProps {
  checked?: StoreRef<boolean> | boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function Switch(props: SwitchProps = {}) {
  const {
    checked,
    size = 'md',
    disabled = false,
    onChange,
    className = '',
  } = props;

  const checkedSignal =
    typeof checked === 'boolean'
      ? createSignal(checked)
      : checked || createSignal(false);

  const getCls = hookTheme(switchComponent);

  fdom.label({
    className() {
      return getCls('switch', { size, className } as any);
    },
    children() {
      fdom.input({
        type: 'checkbox',
        disabled,
        checked() {
          return checkedSignal.get();
        },
        onInput(event) {
          const target = event.target as HTMLInputElement;
          const newChecked = target.checked;
          checkedSignal.set(newChecked);
          onChange?.(newChecked);
        },
      });

      fdom.span({
        className() {
          return getCls('slider', { checked: checkedSignal.get() } as any);
        },
      });
    },
  });

  return checkedSignal;
}

// Tag 组件
export interface TagProps {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  closable?: boolean;
  onClose?: () => void;
  children: string;
  className?: string;
}

export function Tag(props: TagProps) {
  const {
    variant = 'default',
    closable = false,
    onClose,
    children,
    className = '',
  } = props;

  const getCls = hookTheme(tag);

  fdom.span({
    className() {
      return getCls('tag', { variant, className } as any);
    },
    children() {
      fdom.span({ children });

      if (closable) {
        fdom.button({
          className() {
            return getCls('tagClose', {});
          },
          children: '×',
          onClick: onClose,
        });
      }
    },
  });
}

// Avatar 组件
export interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline';
  src?: string;
  alt?: string;
  children?: string;
  className?: string;
}

export function Avatar(props: AvatarProps) {
  const { size = 'md', status, src, alt, children, className = '' } = props;

  const getCls = hookTheme(avatar);

  fdom.div({
    className() {
      return getCls('avatar', { size, status, className } as any);
    },
    children() {
      if (src) {
        fdom.img({
          src,
          alt: alt || '',
          s_width: '100%',
          s_height: '100%',
          s_objectFit: 'cover',
        });
      } else if (children) {
        fdom.span({ children });
      }
    },
  });
}

// Rating 组件
export interface RatingProps {
  value?: StoreRef<number> | number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function Rating(props: RatingProps = {}) {
  const {
    value,
    max = 5,
    size = 'md',
    readonly = false,
    onChange,
    className = '',
  } = props;

  const valueSignal =
    typeof value === 'number' ? createSignal(value) : value || createSignal(0);

  const getCls = hookTheme(rating);

  fdom.div({
    className() {
      return getCls('rating', { size, className } as any);
    },
    children() {
      for (let i = 1; i <= max; i++) {
        const starIndex = i;
        fdom.span({
          className() {
            return getCls('star', {
              filled: valueSignal.get() >= starIndex,
              size,
            } as any);
          },
          children: '★',
          onClick: readonly
            ? undefined
            : () => {
                valueSignal.set(starIndex);
                onChange?.(starIndex);
              },
        });
      }
    },
  });

  return valueSignal;
}

// Skeleton 组件
export interface SkeletonProps {
  variant?: 'title' | 'text' | 'avatar' | 'button' | 'card';
  className?: string;
}

export function Skeleton(props: SkeletonProps) {
  const { variant = 'text', className = '' } = props;

  const getCls = hookTheme(skeleton);

  fdom.div({
    className() {
      return getCls('skeleton', { variant, className } as any);
    },
  });
}
