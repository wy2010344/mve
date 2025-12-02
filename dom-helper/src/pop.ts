import { hookAddResult } from 'mve-core';
import { fdom } from 'mve-dom';
import { createPop, hookDestroy } from 'mve-helper';
import { cns } from 'wy-dom-helper';
import { addEffect, EmptyFun, SetValue } from 'wy-helper';

export function hookExitAnimate<T extends HTMLElement>(
  div: T,
  {
    className,
    operateClone,
  }: {
    className?: string;
    operateClone: (div: T) => {
      then(call: SetValue<any> | EmptyFun): any;
    };
  }
) {
  hookDestroy(() => {
    const rect = div.getBoundingClientRect();
    //并不需要copy
    const copy = div; //div.cloneNode(true) as T
    addEffect(() => {
      createPop(close => {
        //可能会出现更多自定义样式
        fdom.div({
          className: cns('fixed', className),
          s_left: `${rect.left}px`,
          s_top: `${rect.top}px`,
          s_width: `${rect.width}px`,
          s_height: `${rect.height}px`,
          children() {
            hookAddResult(copy);
          },
        });
        addEffect(() => {
          operateClone(copy).then(close as EmptyFun);
        });
      });
    });
  });
}
