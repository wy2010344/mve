import { fdom } from "mve-dom";
import { Avatar } from ".";

export default function () {
  // Avatar 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Avatar 头像',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '不同尺寸：',
              });
              Avatar({ size: 'sm', children: 'S' });
              Avatar({ size: 'md', children: 'M' });
              Avatar({ size: 'lg', children: 'L' });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '在线状态：',
              });
              Avatar({ status: 'online', children: 'ON' });
              Avatar({ status: 'offline', children: 'OFF' });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600',
                children: '文字头像：',
              });
              Avatar({ children: 'A' });
              Avatar({ children: 'AB' });
              Avatar({ children: '张' });
            },
          });
        },
      });
    },
  });

}