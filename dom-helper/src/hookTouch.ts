import { createSignal } from 'wy-helper';

const MIN_DISTANCE = 10;

type Direction = '' | 'vertical' | 'horizontal';

function getDirection(x: number, y: number) {
  if (x > y && x > MIN_DISTANCE) {
    return 'horizontal';
  }
  if (y > x && y > MIN_DISTANCE) {
    return 'vertical';
  }
  return '';
}

export function hookTouch() {
  const startX = createSignal(0);
  const startY = createSignal(0);
  const deltaX = createSignal(0);
  const deltaY = createSignal(0);
  const offsetX = createSignal(0);
  const offsetY = createSignal(0);
  const direction = createSignal<Direction>('');

  const isVertical = () => direction.get() === 'vertical';
  const isHorizontal = () => direction.get() === 'horizontal';

  const reset = () => {
    deltaX.set(0);
    deltaY.set(0);
    offsetX.set(0);
    offsetY.set(0);
    direction.set('');
  };

  const start = ((event: TouchEvent) => {
    reset();
    startX.set(event.touches[0].clientX);
    startY.set(event.touches[0].clientY);
  }) as EventListener;

  const move = ((event: TouchEvent) => {
    const touch = event.touches[0];
    // Fix: Safari back will set clientX to negative number
    deltaX.set(touch.clientX < 0 ? 0 : touch.clientX - startX.get());
    deltaY.set(touch.clientY - startY.get());
    offsetX.set(Math.abs(deltaX.get()));
    offsetY.set(Math.abs(deltaY.get()));

    if (!direction.get()) {
      direction.set(getDirection(offsetX.get(), offsetY.get()));
    }
  }) as EventListener;

  return {
    move,
    start,
    reset,
    startX,
    startY,
    deltaX,
    deltaY,
    offsetX,
    offsetY,
    direction,
    isVertical,
    isHorizontal,
  };
}
