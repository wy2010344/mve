import { fdom } from 'mve-dom';
import { formGroup } from 'wy-dom-helper/window-theme';
import { hookTheme } from '../util';

export interface FormGroupProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  required?: boolean;
  className?: string;
  children: () => void;
}

export function FormGroup(props: FormGroupProps) {
  const {
    label,
    helperText,
    errorText,
    required = false,
    className = '',
    children,
  } = props;

  const getCls = hookTheme(formGroup);
  fdom.div({
    className() {
      return getCls('formGroup', {
        type: 'group',
        className,
      });
    },

    children() {
      // 标签
      if (label) {
        fdom.label({
          className() {
            return getCls('formGroup', {
              type: 'label',
            });
          },
          children: label + (required ? ' *' : ''),
        });
      }

      // 表单控件
      children();

      // 帮助文本或错误信息
      if (errorText) {
        fdom.div({
          className() {
            return getCls('formGroup', {
              type: 'error',
            });
          },
          children: errorText,
        });
      } else if (helperText) {
        fdom.div({
          className() {
            return getCls('formGroup', {
              type: 'helper',
            });
          },
          children: helperText,
        });
      }
    },
  });
}
