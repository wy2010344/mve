/**
 * Showcase 布局辅助组件
 * 提供统一的展示容器样式
 */

import { fdom } from 'mve-dom';
import { hookTheme } from './util';
import { showcase } from 'wy-dom-helper/window-theme';

/**
 * Showcase 容器
 */
export function ShowcaseContainer(children: () => void) {
  const getCls = hookTheme(showcase);

  fdom.div({
    className() {
      return getCls('showcaseContainer');
    },
    children,
  });
}

/**
 * Showcase 区块
 */
export function ShowcaseSection(props: {
  title: string;
  subtitle?: string;
  children: () => void;
}) {
  const getCls = hookTheme(showcase);

  fdom.div({
    className() {
      return getCls('showcaseSection');
    },
    children() {
      fdom.h3({
        className() {
          return getCls('showcaseTitle', { size: 'lg' });
        },
        children: props.title,
      });

      if (props.subtitle) {
        fdom.p({
          className() {
            return getCls('showcaseSubtitle');
          },
          children: props.subtitle,
        });
      }

      props.children();
    },
  });
}

/**
 * Showcase 演示区域
 */
export function ShowcaseDemo(props: {
  variant?: 'default' | 'elevated' | 'outlined';
  direction?: 'row' | 'column';
  children: () => void;
}) {
  const getCls = hookTheme(showcase);

  fdom.div({
    className() {
      return getCls('showcaseDemo', {
        variant: props.variant || 'default',
        direction: props.direction || 'row',
      });
    },
    children: props.children,
  });
}

/**
 * Showcase 描述文本
 */
export function ShowcaseDescription(text: string) {
  const getCls = hookTheme(showcase);

  fdom.p({
    className() {
      return getCls('showcaseDescription');
    },
    children: text,
  });
}

/**
 * Showcase 分割线
 */
export function ShowcaseDivider() {
  const getCls = hookTheme(showcase);

  fdom.hr({
    className() {
      return getCls('showcaseDivider');
    },
  });
}

/**
 * Showcase 网格布局
 */
export function ShowcaseGrid(props: {
  cols?: 1 | 2 | 3 | 4 | 'auto';
  children: () => void;
}) {
  const getCls = hookTheme(showcase);

  fdom.div({
    className() {
      return getCls('showcaseGrid', {
        cols: props.cols || 'auto',
      });
    },
    children: props.children,
  });
}

/**
 * Showcase 标签
 */
export function ShowcaseLabel(text: string) {
  const getCls = hookTheme(showcase);

  fdom.div({
    className() {
      return getCls('showcaseLabel');
    },
    children: text,
  });
}

/**
 * Showcase 代码块
 */
export function ShowcaseCode(code: string) {
  const getCls = hookTheme(showcase);

  fdom.pre({
    className() {
      return getCls('showcaseCode');
    },
    children() {
      fdom.code({
        children: code,
      });
    },
  });
}
