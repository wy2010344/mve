import { fdom } from "mve-dom";
import { Skeleton } from ".";

export default function () {


  // Skeleton 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Skeleton 骨架屏',
      });

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '标题骨架：',
              });
              Skeleton({ variant: 'title' });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '文本骨架：',
              });
              Skeleton({ variant: 'text' });
              Skeleton({ variant: 'text' });
              Skeleton({ variant: 'text' });
            },
          });

          fdom.div({
            className: 'flex items-center gap-4',
            children() {
              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '头像骨架：',
                  });
                  Skeleton({ variant: 'avatar' });
                },
              });

              fdom.div({
                children() {
                  fdom.div({
                    className: 'text-sm text-gray-600 mb-2',
                    children: '按钮骨架：',
                  });
                  Skeleton({ variant: 'button' });
                },
              });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '卡片骨架：',
              });
              Skeleton({ variant: 'card' });
            },
          });
        },
      });
    },
  });
}