import { fdom } from 'mve-dom';
import { Notification } from './index';

export default function NotificationShowcase() {
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
              Notification({
                variant: 'default',
                icon: 'ℹ️',
                title: '默认通知',
                message: '这是一条默认的通知消息',
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
              Notification({
                variant: 'success',
                icon: '✅',
                title: '成功通知',
                message: '操作已成功完成！',
              });

              Notification({
                variant: 'warning',
                icon: '⚠️',
                title: '警告通知',
                message: '请注意这个警告信息',
              });

              Notification({
                variant: 'error',
                icon: '❌',
                title: '错误通知',
                message: '发生了一个错误，请重试',
              });
            },
          });
        },
      });

      // 无标题
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '无标题',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              Notification({
                variant: 'success',
                icon: '✅',
                message: '这是一条没有标题的通知消息',
              });
            },
          });
        },
      });

      // 可关闭
      fdom.div({
        children() {
          fdom.h4({
            className: 'text-md font-semibold mb-3',
            children: '可关闭',
          });
          fdom.div({
            className: 'space-y-4',
            children() {
              Notification({
                variant: 'default',
                icon: 'ℹ️',
                title: '可关闭的通知',
                message: '点击右上角的 × 可以关闭这条通知',
                closable: true,
                onClose: () => console.log('Notification closed'),
              });
            },
          });
        },
      });
    },
  });
}
