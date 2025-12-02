import { fdom } from 'mve-dom';
import { hookTheme } from '../util';
import { button } from 'wy-dom-helper/window-theme';

export interface ButtonProps {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'ghost'
    | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children?: string | (() => void);
  onClick?: (event: MouseEvent) => void;
  className?: string;
}

export function Button(props: ButtonProps = {}) {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    children = 'Button',
    onClick,
    className = '',
  } = props;
  const getCls = hookTheme(button);
  fdom.button({
    className() {
      return getCls('button', {
        variant,
        size,
        iconOnly: false,
        className,
      });
    },

    disabled,
    onClick,
    children,
  });
}

export interface IconButtonProps {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'error'
    | 'ghost'
    | 'outline';
  icon: string;
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  className?: string;
  title?: string;
}

export function IconButton(props: IconButtonProps) {
  const {
    variant = 'primary',
    icon,
    disabled = false,
    onClick,
    className = '',
    title,
  } = props;

  const getCls = hookTheme(button);
  fdom.button({
    className() {
      return getCls('button', {
        variant: variant as any,
        size: 'md',
        iconOnly: true,
        className,
      });
    },

    disabled,
    onClick,
    title,

    children: icon,
  });
}
