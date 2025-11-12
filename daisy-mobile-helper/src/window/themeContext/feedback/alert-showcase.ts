import { fdom } from 'mve-dom';
import { Alert } from './index';

export default function AlertShowcase() {
  fdom.div({
    className: 'space-y-6',
    children() {
      // 基础用法
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '基础用法',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              Alert({
                variant: 'info',
                icon: 'ℹ️',
                children: '这是一条信息提示',
              });
            },
          });
        },
      });

      // 不同类型
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '不同类型',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              Alert({
                variant: 'success',
                icon: '✅',
                children: '操作成功完成！',
              });

              Alert({
                variant: 'warning',
                icon: '⚠️',
                children: '请注意这个警告信息',
              });

              Alert({
                variant: 'error',
                icon: '❌',
                children: '发生了一个错误，请检查后重试',
              });
            },
          });
        },
      });

      // 无图标
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '无图标',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              Alert({
                variant: 'info',
                children: '这是一条没有图标的提示信息',
              });
            },
          });
        },
      });

      // 长文本
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '长文本',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              Alert({
                variant: 'warning',
                icon: '⚠️',
                children:
                  '这是一条较长的警告信息。当提示内容较多时，Alert 组件会自动换行显示，确保所有信息都能被用户看到。建议将重要信息放在前面，次要信息放在后面。',
              });
            },
          });
        },
      });
    },
  });
}
