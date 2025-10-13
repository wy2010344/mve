import { fdom } from 'mve-dom';
import { renderArray } from 'mve-helper';
import { createSignal, emptyArray } from 'wy-helper';

export default function () {
  const list = createSignal(emptyArray as number[]);
  renderArray(list.get, (row, getIndex) => {
    fdom.div({
      children() {
        fdom.span({
          childrenType: 'text',
          children() {
            return `第${getIndex() + 1}行,内容是${row}`;
          },
        });
        fdom.button({
          childrenType: 'text',
          children: '删除',
          onClick() {
            list.set(list.get().filter(x => x != row));
          },
        });
      },
    });
  });
  fdom.button({
    childrenType: 'text',
    children: '添加',
    onClick() {
      list.set(list.get().concat(Date.now()));
    },
  });
}
