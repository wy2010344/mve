import { hookTouch } from './hookTouch';
import { hookDestroy, hookTrackSignal } from 'mve-helper';
import { ValueOrGet, valueOrGetToGet } from 'wy-helper';
type ScrollElement = HTMLElement | Window;

const overflowScrollReg = /scroll|auto|overlay/i;

export function getScrollParent(
  el: Element | null | undefined,
  root: ScrollElement | null | undefined = window
): Window | Element | null | undefined {
  let node = el;

  while (node && node !== root && node.nodeType === 1) {
    const { overflowY } = window.getComputedStyle(node);
    if (overflowScrollReg.test(overflowY)) {
      return node;
    }
    node = node.parentNode as Element;
  }

  return root;
}

const totalLockCount = new Map<string, number>();
// 移植自vant：https://github.com/youzan/vant/blob/HEAD/src/composables/use-lock-scroll.ts
export function hookLockScroll(
  shouldLock: () => boolean,
  componentName: string,
  rootRef?: ValueOrGet<HTMLElement>
) {
  const touch = hookTouch();
  const BODY_LOCK_CLASS = `${componentName}--lock`;
  const getRootRef = valueOrGetToGet(rootRef);
  let isLocked = false;
  const onTouchMove = (event: TouchEvent) => {
    touch.move(event);

    const direction = touch.deltaY.get() > 0 ? '10' : '01';
    const el = getScrollParent(
      event.target as Element,
      getRootRef()
    ) as HTMLElement;
    if (!el) return;
    const { scrollHeight, offsetHeight, scrollTop } = el;
    let status = '11';

    if (scrollTop === 0) {
      status = offsetHeight >= scrollHeight ? '00' : '01';
    } else if (scrollTop + offsetHeight >= scrollHeight) {
      status = '10';
    }

    if (
      status !== '11' &&
      touch.isVertical() &&
      !(parseInt(status, 2) & parseInt(direction, 2))
    ) {
      if (event.cancelable) {
        event.preventDefault();
      }
    }
  };

  const lock = () => {
    isLocked = true;
    document.addEventListener('touchstart', touch.start);
    document.addEventListener('touchmove', onTouchMove, { passive: false });

    if (!totalLockCount.get(BODY_LOCK_CLASS)) {
      document.body.classList.add(BODY_LOCK_CLASS);
    }

    totalLockCount.set(
      BODY_LOCK_CLASS,
      (totalLockCount.get(BODY_LOCK_CLASS) ?? 0) + 1
    );
  };

  const unlock = () => {
    isLocked = false;
    const sum = Array.from(totalLockCount.values()).reduce(
      (acc, val) => acc + val,
      0
    );
    if (sum) {
      document.removeEventListener('touchstart', touch.start);
      document.removeEventListener('touchmove', onTouchMove);

      totalLockCount.set(
        BODY_LOCK_CLASS,
        Math.max((totalLockCount.get(BODY_LOCK_CLASS) ?? 0) - 1, 0)
      );

      if (!totalLockCount.get(BODY_LOCK_CLASS)) {
        document.body.classList.remove(BODY_LOCK_CLASS);
      }
    }
  };
  hookTrackSignal(shouldLock, value => {
    value ? lock() : unlock();
  });
  hookDestroy(() => {
    if (isLocked) {
      unlock();
    }
  });
}
