import { hookDestroy } from 'mve-helper';
import { StoreRef } from 'wy-helper';

function pluginTouchHover(hover: StoreRef<boolean>) {
  const startTime = 50;
  const stayTime = 70;

  // 返回一个ref函数，用于设置到DOM元素上
  return (element: HTMLElement) => {
    const handleTouchStart = () => {
      setTimeout(() => {
        hover.set(true);
      }, startTime);
    };

    const handleTouchEnd = () => {
      setTimeout(() => {
        hover.set(false);
      }, stayTime);
    };

    element.addEventListener('touchstart', handleTouchStart, { capture: false, passive: true });
    element.addEventListener('touchend', handleTouchEnd, false);

    // 注册清理函数
    hookDestroy(() => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    });
  };
}

export default pluginTouchHover;
