import { animate, AnimationOptions } from 'motion';
import { fdom } from 'mve-dom';
import { hookTrackSignal } from 'mve-helper';
import { cns } from 'wy-dom-helper';
import { addEffect, emptyObject, GetValue, PointKey } from 'wy-helper';

export function hookTabLayout(
  change: GetValue<any>,
  getCurrentNode: GetValue<Element | null>,
  direction: PointKey = 'x',
  config?: AnimationOptions
) {
  const offsetKey = direction == 'x' ? 'offsetLeft' : 'offsetTop';

  hookTrackSignal(change, function (tp) {
    const node1 = getCurrentNode();
    addEffect(() => {
      const node2 = getCurrentNode();
      if (node1 && node2 && node1 != node2) {
        const b1 = (node1 as HTMLButtonElement)[offsetKey];
        const b2 = (node2 as HTMLButtonElement)[offsetKey];
        const diff = b1 - b2;
        animate(
          node2,
          {
            [direction]: [diff, 0],
          },
          config
        );
        const child1 = node2.firstChild as HTMLSpanElement;
        if (child1) {
          animate(
            child1,
            {
              [direction]: [-diff, 0],
            },
            config
          );
        }
      }
    });
  });
}

export function createTabList<T>({
  className,
  onChange,
  value,
  options,
  childClassName,
  renderChild,
  direction,
  animationConfig,
}: {
  className?: string;
  options: readonly T[];
  value: GetValue<T>;
  onChange: (v: T) => void;
  renderChild(v: T): void;
  childClassName?: string;
  direction?: PointKey;
  animationConfig?: AnimationOptions;
}) {
  fdom.div({
    role: 'tablist',
    className: `daisy-tabs daisy-tabs-box ${className}`,
    children(node: HTMLDivElement) {
      options.forEach(rt => {
        fdom.button({
          className() {
            return cns(
              'daisy-tab',
              childClassName,
              rt == value() && 'daisy-tab-active'
            );
          },
          role: 'tab',
          onClick() {
            onChange(rt);
          },
          children() {
            renderChild(rt);
          },
        });
      });
      hookTabLayout(
        value,
        () => node.querySelector('.daisy-tab-active'),
        direction,
        animationConfig
      );
    },
  });
}
