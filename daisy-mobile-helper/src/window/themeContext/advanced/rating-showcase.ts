import { fdom } from "mve-dom";
import { createSignal } from "wy-helper";
import { Rating } from ".";

export default function () {


  // Rating 示例
  fdom.div({
    className: 'mb-8',
    children() {
      fdom.h3({
        className: 'text-lg font-semibold mb-4',
        children: 'Rating 评分',
      });

      const ratingValue = createSignal(3);

      fdom.div({
        className: 'space-y-4',
        children() {
          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '不同尺寸：',
              });
              fdom.div({
                className: 'space-y-2',
                children() {
                  Rating({ size: 'sm', value: 4 });
                  Rating({ size: 'md', value: 4 });
                  Rating({ size: 'lg', value: 4 });
                },
              });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children() {
                  return `交互式评分 (${ratingValue.get()} 星)：`;
                },
              });
              Rating({
                value: ratingValue,
                onChange: value => {
                  console.log('Rating changed:', value);
                },
              });
            },
          });

          fdom.div({
            children() {
              fdom.div({
                className: 'text-sm text-gray-600 mb-2',
                children: '只读模式：',
              });
              Rating({ value: 5, readonly: true });
            },
          });
        },
      });
    },
  });

}