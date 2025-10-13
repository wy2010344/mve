import { fdom, renderHtml } from 'mve-dom';
import { renderInput } from 'mve-dom-helper';
import { toGetText, toHtml, toText } from 'wy-dom-helper';
import { createSignal } from 'wy-helper';

export default function () {
  const count = createSignal(0);
  fdom.button({
    onClick() {
      count.set(count.get() + 1);
    },
    childrenType: 'text',
    children() {
      return `count - ${count.get()}`;
    },
  });
  renderHtml`<i>bbb${count.get}</i>`;
  fdom.div({
    children: toHtml`<b>abc${count.get}</b>`,
  });

  const value = createSignal('');
  renderInput(
    value.get,
    v => {
      console.log('d', v);
      value.set(v);
    },
    fdom.input()
  );
}
