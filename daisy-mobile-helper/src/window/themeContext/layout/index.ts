import { fdom } from 'mve-dom';
import { layout } from 'wy-dom-helper/window-theme';
import { hookTheme } from '../util';

export interface ContainerProps {
  className?: string;
  children: () => void;
}

export function Container(props: ContainerProps) {
  const getCls = hookTheme(layout);
  fdom.div({
    className() {
      return getCls('layout', {
        type: 'container',
        className: props.className || '',
      });
    },
    children: props.children,
  });
}

export interface GridProps {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: () => void;
}

export function Grid(props: GridProps) {
  const { cols = 3, gap = 'md', className = '', children } = props;

  const getCls = hookTheme(layout);
  fdom.div({
    className() {
      return getCls('layout', {
        type: 'grid',
        cols,
        gap,
        className,
      });
    },
    children,
  });
}

export interface FlexProps {
  direction?: 'row' | 'col';
  wrap?: boolean;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  items?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children: () => void;
}

export function Flex(props: FlexProps) {
  const {
    direction = 'row',
    wrap = false,
    justify = 'start',
    items = 'start',
    gap = 'md',
    className = '',
    children,
  } = props;

  const getCls = hookTheme(layout);
  fdom.div({
    className() {
      return getCls('layout', {
        type: 'flex',
        direction,
        wrap,
        justify,
        items,
        gap,
        className,
      });
    },
    children,
  });
}
// 导出 showcase
