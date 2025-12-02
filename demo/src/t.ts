import { renderForEach } from 'mve-core';
import { fdom } from 'mve-dom';
import { createSignal } from 'wy-helper';

const map = createSignal<Map<number, string>>(new Map());

renderForEach<number, string>(
  callback => {
    const m = map.get();
    m.forEach((key, value) => {
      callback(key, value);
    });
  },
  (key, et) => {
    fdom.div({
      children() {
        return `${key}--${et.getIndex()}--${et.getValue()}`;
      },
    });
  }
);

const a = [1, 2, 3];
a.forEach(function (row, i) {
  fdom.div({
    children: `${row}--${i}`,
  });
});
