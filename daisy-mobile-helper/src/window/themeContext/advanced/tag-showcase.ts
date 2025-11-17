import { fdom } from "mve-dom";
import { Tag } from ".";

export default function () {

  // Tag 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Tag 标签',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            className: 'flex flex-wrap gap-2',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600 w-full mb-2',
                children: '不同颜色：',
              });
              Tag({ variant: 'default', children: 'Default' });
              Tag({ variant: 'primary', children: 'Primary' });
              Tag({ variant: 'secondary', children: 'Secondary' });
              Tag({ variant: 'success', children: 'Success' });
              Tag({ variant: 'warning', children: 'Warning' });
              Tag({ variant: 'error', children: 'Error' });
            },
          });

          fdom.div({
            className: 'flex flex-wrap gap-2',
            children() {
              fdom.span({
                className: 'text-sm text-gray-600 w-full mb-2',
                children: '可关闭：',
              });
              Tag({
                variant: 'primary',
                closable: true,
                children: 'Closable Tag',
                onClose: () => console.log('Tag closed'),
              });
              Tag({
                variant: 'success',
                closable: true,
                children: 'Another Tag',
              });
            },
          });
        },
      });
    },
  });

}