import { fdom, FPDomAttributes } from 'mve-dom';
import {
  cns,
  createPopListWithRearrange,
  PopWithRearrange,
} from 'mve-dom-helper';
import {
  delay,
  EmptyFun,
  normalMapCreater,
  removeEqual,
  RMap,
  run,
  ValueOrGet,
  movePanelResizeAuto,
  OneSetStoreRef,
  DragMoveStep,
  doMoveAcc,
} from 'wy-helper';
import { pointerMove } from 'wy-dom-helper';
import { hookCurrentParent, hookIsDestroyed } from 'mve-core';
import { windowStyle, scrollbar, statusBar } from 'wy-dom-helper/window-theme';
import { hookTheme } from './themeContext/util';

export const { renderPop: renderWindows, createPop: createWindow } =
  createPopListWithRearrange();

export let lastClientEvnet: PointerEvent | undefined;
window.addEventListener('pointerup', e => (lastClientEvnet = e), true);

export function instanceWithCopy<T extends any[], R>(
  creater: (clone: () => R, ...vs: T) => R
) {
  return function (...vs) {
    function clone() {
      return creater(clone, ...vs);
    }
    return creater(clone, ...vs);
  } as (...vs: T) => R;
}

export interface PanelWithClose {
  panel(info: PopWithRearrange<any>): void;
  closeOther(): void;
}

export function cacheCreater<K>(
  creater: () => RMap<K, PanelWithClose> & {
    delete(key: K): void;
  } = normalMapCreater
) {
  const map = creater();
  return function (
    key: K,
    creater: (closeIt: (other?: boolean) => void) => PanelWithClose
  ) {
    let old = map.get(key);
    if (old) {
      return createWindow(old.panel);
    } else {
      old = creater(function (other) {
        if (other) {
          old?.closeOther();
        } else {
          out.closeIt(null);
        }
      });
      map.set(key, old);
      const out = createWindow(old.panel);
      out.closeSet.add(() => {
        map.delete(key);
      });
      return out;
    }
  };
}

export const panel = instanceWithCopy<
  [
    (info: PopWithRearrange<any>) => {
      typeIcon?: ValueOrGet<string>;
      title: ValueOrGet<string | number>;
      x?: OneSetStoreRef<number> | number;
      y?: OneSetStoreRef<number> | number;
      width?: OneSetStoreRef<number> | number;
      height?: OneSetStoreRef<number> | number;
      minWidth?: number;
      minHeight?: number;
      children(): void;
      noCopy?: boolean;
      titleControls?(): void;
    } & FPDomAttributes<'div'>,
  ],
  PanelWithClose
>(function (clone, callback) {
  const closeList: EmptyFun[] = [];
  return {
    closeOther() {
      closeList.forEach(run);
    },
    panel(info) {
      const parent = hookCurrentParent() as HTMLDivElement;
      const isDestroyed = hookIsDestroyed();
      const e = lastClientEvnet;
      const {
        title,
        typeIcon,
        width,
        height,
        x: _x,
        y: _y,
        minHeight,
        minWidth,
        children,
        className,
        noCopy,
        titleControls,
        ...args
      } = callback(info);

      const x = movePanelResizeAuto({
        size: width,
        direction: 'x',
        position: _x ?? e?.pageX ?? 0,
        minSize: minWidth,
        getMaxSize() {
          return parent.clientWidth;
        },
      });
      const y = movePanelResizeAuto({
        size: height,
        direction: 'y',
        position: _y ?? e?.pageY ?? 0,
        minSize: minHeight,
        getMaxSize() {
          return parent.clientHeight;
        },
      });
      function beginStep(
        e: DragMoveStep & {
          point: PointerEvent;
        }
      ) {
        const moveX = doMoveAcc(x.onMove(e));
        const moveY = doMoveAcc(y.onMove(e));
        let lastE = e.point;
        document.body.style.userSelect = 'none';

        pointerMove({
          onMove(e) {
            moveX(e.pageX - lastE.pageX);
            moveY(e.pageY - lastE.pageY);
            lastE = e;
          },
          onEnd(e) {
            document.body.style.userSelect = '';
          },
        });
      }

      const getWindowCls = hookTheme(windowStyle);

      fdom.div({
        ...args,
        onPointerDown(e) {
          if (isDestroyed()) {
            return;
          }
          info.setIndex(-1);
        },
        willRemove(node) {
          node.classList.remove('ds-animate-appear');
          node.classList.add('ds-animate-disappear');
          return delay(300);
        },
        className: cns(
          className,
          getWindowCls('container', {}),
          'ds-animate-appear'
        ),
        s_left() {
          return `${x.position()}px`;
        },
        s_top() {
          return y.position() + 'px';
        },
        s_width() {
          return x.size() + 'px';
        },
        s_height() {
          return y.size() + 'px';
        },
        s_zIndex: info.getIndex,
        children() {
          // 窗口标题栏
          fdom.div({
            className: getWindowCls('title'),
            children() {
              fdom.div({
                className: getWindowCls('titleBarContent', {}),
                children() {
                  fdom.span({
                    className: getWindowCls('titleBarIcon', {}),
                    children: typeIcon,
                  });
                  fdom.span({
                    className: getWindowCls('titleBarTitle', {}),
                    children: title,
                  });
                },
                onPointerDown(e: PointerEvent) {
                  beginStep({
                    action: 'move',
                    point: e,
                  });
                },
              });

              // 窗口控制按钮
              fdom.div({
                className: getWindowCls('titleBarControls', {}),
                children() {
                  titleControls?.();

                  if (!noCopy) {
                    fdom.button({
                      className: cns(
                        getWindowCls('control', {
                          variant: 'success',
                        }),
                        'text-xs'
                      ),
                      children: '□',
                      title: '克隆',
                      onClick() {
                        const out = clone();
                        const info = createWindow(out.panel);
                        info.closeSet.add(() => {
                          removeEqual(closeList, info.closeIt);
                          removeEqual(closeList, out.closeOther);
                        });
                        closeList.push(info.closeIt);
                        closeList.push(out.closeOther);
                      },
                    });
                  }
                  fdom.button({
                    className: getWindowCls('control', {
                      variant: 'danger',
                    }),
                    children: '×',
                    title: '关闭',
                    onClick: info.closeIt,
                  });
                },
              });
            },
          });
          // 窗口内容
          children();

          // 调整大小手柄
          fdom.div({
            className: getWindowCls('resizeHandle', {
              direction: 'se',
            }),
            onPointerDown(e: PointerEvent) {
              beginStep({
                action: 'drag',
                point: e,
                bottom: true,
                right: true,
              });
            },
          });
          // 边缘调整手柄
          fdom.div({
            className: getWindowCls('resizeHandle', {
              direction: 's',
            }),
            onPointerDown(e: PointerEvent) {
              beginStep({
                action: 'drag',
                point: e,
                bottom: true,
              });
            },
          });

          fdom.div({
            className: getWindowCls('resizeHandle', {
              direction: 'e',
            }),
            onPointerDown(e: PointerEvent) {
              beginStep({
                action: 'drag',
                point: e,
                right: true,
              });
            },
          });
        },
      });
    },
  };
});

// 创建样式工具函数
export function getCustomScrollCss() {
  const getScrollbarCls = hookTheme(scrollbar);
  return getScrollbarCls('scrollbar', { variant: 'default' });
}

export function getStatusBarCss(
  variant: 'default' | 'primary' | 'success' | 'warning' | 'error' = 'default',
  size: 'sm' | 'md' | 'lg' = 'md'
) {
  const getStatusBarCls = hookTheme(statusBar);
  return getStatusBarCls('statusBar', { variant, size });
}
