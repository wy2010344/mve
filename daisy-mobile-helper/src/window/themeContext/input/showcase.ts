import { fdom } from 'mve-dom';
import { createSignal } from 'wy-helper';
import { Input, Textarea, Select, Checkbox } from './index';
import { FormGroup } from '../form-group';
import { Grid, Flex } from '../layout';
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

export default function InputShowcase() {
  const username = createSignal('');
  const email = createSignal('');
  const description = createSignal('');
  const city = createSignal('');
  const agreeTerms = createSignal(false);

  Grid({
    cols: 2,
    gap: 'lg',
    children() {
      // 基础输入
      fdom.div({
        children() {
          ShowcaseSection('基础输入', () => {
            Flex({
              direction: 'col',
              gap: 'md',
              children() {
                FormGroup({
                  label: '用户名',
                  children() {
                    Input({
                      value: username,
                      placeholder: '请输入用户名...',
                    });
                  },
                });

                FormGroup({
                  label: '邮箱',
                  children() {
                    Input({
                      type: 'email',
                      value: email,
                      placeholder: 'user@example.com',
                    });
                  },
                });

                FormGroup({
                  label: '密码',
                  children() {
                    Input({
                      type: 'password',
                      placeholder: '请输入密码...',
                    });
                  },
                });
              },
            });
          });
        },
      });

      // 其他表单控件
      fdom.div({
        children() {
          ShowcaseSection('其他控件', () => {
            Flex({
              direction: 'col',
              gap: 'md',
              children() {
                FormGroup({
                  label: '描述',
                  children() {
                    Textarea({
                      value: description,
                      placeholder: '请输入描述...',
                      rows: 3,
                    });
                  },
                });

                FormGroup({
                  label: '城市',
                  children() {
                    Select({
                      value: city,
                      options: [
                        { value: '', label: '请选择' },
                        { value: 'beijing', label: '北京' },
                        { value: 'shanghai', label: '上海' },
                      ],
                    });
                  },
                });

                fdom.div({
                  children() {
                    Checkbox({
                      checked: agreeTerms,
                      label: '同意协议',
                    });
                  },
                });
              },
            });
          });
        },
      });
    },
  });
}
