import { fdom } from 'mve-dom';
import { ValueOrGet } from 'wy-helper';
import {
  typeCard,
  colorPicker,
  statusIndicator,
} from 'wy-dom-helper/window-theme';
import { hookTheme } from './themeContext/util';

/**
 * 类型卡片组件 - 用于显示类型信息
 */
export function renderTypeCard({
  title,
  description,
  count,
  onClick,
  variant = 'default',
}: {
  title: ValueOrGet<string>;
  description: ValueOrGet<string>;
  count?: ValueOrGet<number>;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'secondary' | 'tertiary';
}) {
  const getTypeCardCls = hookTheme(typeCard);

  fdom.div({
    className: getTypeCardCls({ variant, part: 'card' }),
    onClick,
    children() {
      fdom.div({
        className: getTypeCardCls({ part: 'header' }),
        children() {
          fdom.h3({
            className: getTypeCardCls({ part: 'title' }),
            children: title,
          });
          if (count !== undefined) {
            fdom.span({
              className: getTypeCardCls({ part: 'count' }),
              children: count,
            });
          }
        },
      });

      fdom.p({
        className: getTypeCardCls({ part: 'description' }),
        children: description,
      });
    },
  });
}

/**
 * 颜色选择器标签组件
 */
export function renderColorPickerLabel({
  color,
  onChange,
}: {
  color: ValueOrGet<string>;
  onChange: (color: string) => void;
}) {
  const getColorPickerCls = hookTheme(colorPicker);

  fdom.label({
    className: getColorPickerCls({ part: 'label' }),
    s_background: color,
    children() {
      fdom.input({
        type: 'color',
        className: getColorPickerCls({ part: 'input' }),
        value: color,
        onInput(e: Event) {
          onChange((e.currentTarget as HTMLInputElement).value);
        },
      });
    },
  });
}

/**
 * 状态指示器组件
 */
export function renderStatusIndicator({
  status,
  label,
}: {
  status: 'success' | 'warning' | 'error' | 'info';
  label: ValueOrGet<string>;
}) {
  const getStatusIndicatorCls = hookTheme(statusIndicator);

  fdom.div({
    className: getStatusIndicatorCls({ part: 'indicator' }),
    children() {
      fdom.div({
        className: getStatusIndicatorCls({ part: 'dot', status }),
      });
      fdom.span({
        className: getStatusIndicatorCls({ part: 'label' }),
        children: label,
      });
    },
  });
}
