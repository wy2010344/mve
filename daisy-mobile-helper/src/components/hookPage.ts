import {
  addEffect,
  EmptyFun,
  emptyObject,
  GetValue,
  SetValue,
} from 'wy-helper';
import { hookDestroy } from 'mve-helper';
import { createPop } from 'mve-dom-helper';
import { hookAddResult } from 'mve-core';
import {
  animate,
  AnimationOptions,
  CSSStyleDeclarationWithTransform,
  DOMKeyframesDefinition,
  ValueKeyframe,
} from 'motion';
import { fdom } from 'mve-dom';
import { Action } from 'history';
import { cns } from 'wy-dom-helper';
import { routerConsume } from 'mve-dom-helper/history';
export function getTabsDirection(
  get: () => {
    fromPathname?: string;
    pathname: string;
  },
  findTabIndex: (n: string) => number
) {
  const { pathname, fromPathname } = get();
  if (!fromPathname) {
    return;
  }
  const beforeIndex = findTabIndex(fromPathname);
  if (beforeIndex < 0) {
    return;
  }
  const index = findTabIndex(pathname);
  if (index < 0) {
    return;
  }
  if (beforeIndex < index) {
    return 'toRight';
  }
  if (beforeIndex > index) {
    return 'toLeft';
  }
}

export type PageDirection = 'toRight' | 'toLeft';

export function hookTabPage(
  getDirection: GetValue<PageDirection | undefined>,
  div: HTMLElement,
  {
    createPop: createPopI = createPop,
    animationConfig = {
      type: 'tween',
      // duration: 100
    },
    exitContainerClassName,
    getContainer = div => {
      const rect = div.getBoundingClientRect();
      return () => {
        return fdom.div({
          className: cns('fixed overflow-hidden', exitContainerClassName),
          s_left: `${rect.left}px`,
          s_top: `${rect.top}px`,
          s_width: `${rect.width}px`,
          s_height: `${rect.height}px`,
          children() {
            hookAddResult(div);
          },
        });
      };
    },
    enter = (div, push) => {
      animate(
        div,
        {
          x: push ? ['100%', 0] : ['-100%', 0],
        },
        animationConfig
      );
    },
    exit = (div, push) => {
      return animate(
        div,
        {
          x: push ? [0, '-100%'] : [0, '100%'],
        },
        animationConfig
      ).finished;
    },
    cloneNode,
  }: TabPageConfig = emptyObject
) {
  addEffect(() => {
    const direction = getDirection();
    if (direction) {
      enter(div, direction == 'toRight');
    }
  });
  hookDestroy(() => {
    const renderContainer = getContainer(
      cloneNode ? (div.cloneNode(true) as any) : div
    );
    addEffect(() => {
      const direction = getDirection();
      if (direction) {
        createPopI(close => {
          const div2 = renderContainer();
          addEffect(() => {
            exit(div2, direction == 'toRight').then(close);
          });
        });
      }
    });
  });
}

export interface TabPageConfig {
  enter?(div: HTMLElement, push?: boolean): void;
  exit?(div: HTMLElement, push?: boolean): Promise<any>;
  cloneNode?: boolean;
  createPop?(callback: SetValue<EmptyFun>): void;
  animationConfig?: AnimationOptions;
  exitContainerClassName?: string;
  getContainer?(div: HTMLElement): () => HTMLElement;
}

export function hookPage(div: HTMLElement, config?: TabPageConfig) {
  const { getHistoryState } = routerConsume();
  hookTabPage(
    () => (getHistoryState().action == Action.Pop ? 'toLeft' : 'toRight'),
    div,
    config
  );
}
