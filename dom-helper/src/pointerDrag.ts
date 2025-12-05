import { hookDestroy, renderArrayKey } from 'mve-helper';
import { pointerMove } from 'wy-dom-helper';
import {
  AnimateSignal,
  DeltaXSignalAnimationConfig,
  GetValue,
  PointKey,
  ReadArray,
  SetValue,
  StoreRef,
  ValueOrGet,
  addEffect,
  createSignal,
  emptyFun,
  memo,
  readArraySlice,
  valueOrGetToGet,
} from 'wy-helper';
import { setEdgeScroll, setEdgeScrollPoint } from './moveEdgeScroll';
import { LayoutAnimateFun, setLayoutIndex } from './layoutIndex';

/**
 * 二分查找（升序数组）
 * @param arr 已排序数组
 * @param target 目标值
 * @param compare 可选的比较器；默认升序数字比较
 * @returns 找到则返回索引；否则返回 -(插入位置 + 1)，保证负数且连续
 */
export function binarySearch<A, T>(
  arr: ReadArray<A>,
  compare: (a: A) => number
): number {
  // for (let i = 0; i < arr.length; i++) {
  //   //可以启用二分查找法
  //   const o = compare(arr[i]);
  //   if (o > 0) {
  //     return i;
  //   }
  // }
  // return arr.length;

  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    // 位运算防溢出
    const mid = Math.floor((left + right) / 2); // 无位运算
    const cmp = Math.sign(compare(arr[mid]));

    if (cmp === 0)
      return mid; // 命中
    else if (cmp < 0) {
      // 中间值偏小，搜右半
      left = mid + 1;
    } else {
      right = mid - 1; // 中间值偏大，搜左半
    }
  }

  return left;
  // 未找到：返回 -(插入位置 + 1)
  // return -(left + 1);
}

function watchScrollable(el: HTMLElement, cb: SetValue<boolean>) {
  let last = false; // 缓存上一次的溢出状态
  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const cr = entry.contentRect; // 内容尺寸
      const isScrollable = cr.height > el.clientHeight;
      if (isScrollable !== last) {
        last = isScrollable;
        cb(isScrollable);
      }
    }
  });
  ro.observe(el, { box: 'content-box' }); // 只观察内容区
  return () => ro.disconnect(); // 返回取消函数
}
const acceptKey = Symbol('accept');
type GetActiveContainer<DragData> = (d: DragData) => Element | null;

export type AcceptData<DragData, DragType> = {
  data: DragData;
  container: Element;
  accept: DragType;
};
export function hookAccept<DragData, DragType>(
  getDragData: () => DragData | void,
  getActiveContainer: GetActiveContainer<DragData>
) {
  return memo<undefined | AcceptData<DragData, DragType>>(last => {
    const data = getDragData();
    if (!data) {
      return;
    }
    let element: Element | null = getActiveContainer(data);

    while (element) {
      const accept = (element as any)[acceptKey] as
        | ((n: DragData) => DragType)
        | undefined;
      if (accept) {
        if (last && last.container == element && last.data == data) {
          //幂等缓存
          return last;
        }
        return {
          data,
          accept: accept(data),
          container: element,
        };
      }
      element = element.parentElement;
    }
  });
}

class Preview<DragData> {
  constructor(readonly dragData: DragData) {}
}
type PointerEventBase = {
  pageX: number;
  pageY: number;
  currentTarget: any;
};
export function buildContainer<DragData, DragType, K = any>({
  setDragData,
  getDragData,
  getMeasurePositionDiff,
  getDragX,
  getDragY,
  setDragTo,
  getActiveContainer,
  setActiveContainer,
  getDropped,
  getPreviewRef,
  getDragId,
  pluginFinishElement,
  onDragFinish,
  changeIndexAnimate: superAnimate,
}: {
  setDragData: SetValue<DragData>;
  getDragData: GetValue<DragData | undefined>;
  getMeasurePositionDiff(d: DragData, dir: PointKey): number;
  getDragY(x: DragData): number;
  getDragX(x: DragData): number;
  setDragTo(x: DragData, n: PointerEventBase): void;
  getDragId(x: DragData): K;
  //是否已经停止拖拽
  getDropped(n: DragData): any;
  getActiveContainer: GetActiveContainer<DragData>;
  setActiveContainer(n: DragData, e: Element): void;
  getPreviewRef(x: DragData): Element | undefined;
  pluginFinishElement(d: DragData, e: Element, key: K): void;

  onDragFinish(d: DragData, accept?: AcceptData<DragData, DragType>): void;
  changeIndexAnimate?: LayoutAnimateFun;
}) {
  /**
   * 全局的检查，是因为有可能来自父层级
   */
  const getAccept = hookAccept<DragData, DragType>(
    getDragData,
    getActiveContainer
  );
  const dragPointer = createSignal<PointerEventBase | undefined>(undefined);
  function onPointerDown(
    e: PointerEventBase,
    createDragData: () => DragData,
    container: Element
  ) {
    if (getDragData()) {
      console.log('正在拖拽中。。。');
      return;
    }
    dragPointer.set(e);
    const d = createDragData();
    setDragData(d);
    setActiveContainer(d, container);
    document.body.style.userSelect = 'none';
    pointerMove({
      onMove(moveE) {
        dragPointer.set(moveE);
        setDragTo(d, moveE);
        //要从preview的上一层开始
        const dx = getMeasurePositionDiff(d, 'x');
        const dy = getMeasurePositionDiff(d, 'y');
        let place =
          dx || dy
            ? document.elementFromPoint(getDragX(d) + dx, getDragY(d) + dy)
            : (moveE.target as any);
        const preveRef = getPreviewRef(d);
        if (preveRef) {
          if (preveRef.contains(place)) {
            place = preveRef.parentElement;
          }
        }
        setActiveContainer(d, place);
      },
      onEnd(e) {
        document.body.style.userSelect = '';
        onDragFinish(d, getAccept());
        dragPointer.set(undefined);
      },
    });
  }

  function createListContainer<T>({
    getList,
    getId,
    accept,
    preview = emptyFun,
    createDragData,
    direction = 'y',
    changeIndexAnimate = superAnimate,
  }: CreateListContainerArgs<T, DragData, DragType, K>): ListContainer<T, K> {
    const getDirection = valueOrGetToGet(direction);
    const map = new Map<K, HTMLElement>();
    const scrollTop = createSignal(0);
    const scrollLeft = createSignal(0);
    function index() {
      const dragD = getDragData();
      if (!dragD) {
        return;
      }
      if (getAccept()?.container != n.container) {
        return;
      }
      if (getDropped(dragD)) {
        return;
      }
      const crect = n.container!.getBoundingClientRect();
      if (getDirection() == 'y') {
        //假设需要取拖拽元素的中间点
        const dy = getDragY(dragD) + getMeasurePositionDiff(dragD, 'y');
        const st = scrollTop.get();
        if (dy < crect.top) {
          return;
        }
        if (dy > crect.bottom) {
          return;
        }
        const tasks = getList();
        return {
          dragData: dragD,
          index: binarySearch(tasks, function (task) {
            const div = map.get(getId(task));
            if (!div) {
              throw '';
            }
            //使用offsetTop,所有父容器需要是relative/absolute/fixed
            const top = div.offsetTop + crect.top - st;
            return top + div.clientHeight / 2 - dy;
          }),
        };
      } else {
        const dx = getDragX(dragD) + getMeasurePositionDiff(dragD, 'x');
        const st = scrollLeft.get();
        if (dx < crect.left) {
          return;
        }
        if (dx > crect.right) {
          return;
        }
        const tasks = getList();
        return {
          dragData: dragD,
          index: binarySearch(tasks, function (task) {
            const div = map.get(getId(task));
            if (!div) {
              throw '';
            }
            const left = div.offsetLeft + crect.left - st;
            return left + div.clientWidth / 2 - dx;
          }),
        };
      }
      // return tasks.length;
    }
    const getTasksWithPreview = memo<ReadArray<T | Preview<DragData>>>(() => {
      const i = index();
      if (!i) {
        return getList();
      }
      const ts = readArraySlice(getList()) as (T | Preview<DragData>)[];
      ts.splice(i.index, 0, new Preview(i.dragData));
      return ts;
    });
    const n: ListContainer<T, K> = {
      plugin(div: HTMLElement) {
        n.container = div;
        (div as any)[acceptKey] = accept;
        div.addEventListener('scroll', e => {
          scrollTop.set(div.scrollTop);
          scrollLeft.set(div.scrollLeft);
        });
        setEdgeScrollPoint(div, {
          getPoint(n, dir) {
            const dragData = getDragData();
            const diff = dragData ? getMeasurePositionDiff(dragData, dir) : 0;
            if (dir == 'x') {
              return n.pageX + diff;
            }
            return n.pageY + diff;
          },
          movePoint() {
            //其实是一停止拖拽，就需要停止
            if (getTasksWithPreview().length != getList().length) {
              return dragPointer.get();
            }
          },
          direction: getDirection,
        });
      },
      renderChildren(render) {
        renderArrayKey(
          getTasksWithPreview,
          v => {
            if (v instanceof Preview) {
              return v;
            }
            return getId(v as T);
          },
          function (getValue, getIndex, key) {
            if (key instanceof Preview) {
              preview(getIndex, key.dragData);
            } else {
              render({
                container: n.container!,
                key: key as K,
                getData: getValue as GetValue<T>,
                getIndex,
                plugin(e) {
                  setLayoutIndex(e, getIndex, getDirection, changeIndexAnimate);
                  map.set(key as K, e);
                  hookDestroy(() => {
                    map.delete(key as K);
                  });
                  const d = getDragData();
                  if (d && getDropped(d) && getDragId(d) == key) {
                    addEffect(() => {
                      pluginFinishElement(d, e, key);
                    });
                  }
                },
                onPointerDown(e, target) {
                  onPointerDown(
                    e,
                    () => {
                      return createDragData(e, key, target);
                    },
                    n.container!
                  );
                },
              });
            }
          }
        );
      },
    };
    return n;
  }
  return {
    onPointerDown,
    getAccept,
    createListContainer,
  };
}

export type CreateListContainerArgs<T, DragData, DragType, K = any> = {
  /**是否接受dragData中的data,如果accept，返回什么类型*/
  accept(n: DragData): DragType | void;
  direction?: ValueOrGet<PointKey>;
  getList: GetValue<ReadArray<T>>;
  getId(n: T): K;
  /**点位预览*/
  preview?(getIndex: GetValue<number>, d: DragData): void;
  /**
   *
   * @param e
   * @param key
   * @param target 真实的拖拽元素
   */
  createDragData(e: PointerEventBase, key: K, target?: Element): DragData;
  changeIndexAnimate?: LayoutAnimateFun;
};

export type CreateListContainer<T, DragData, DragType, K = any> = (
  a: CreateListContainerArgs<T, DragData, DragType, K>
) => ListContainer<T, K>;
export type ListContainer<T, K = any> = {
  plugin(div: HTMLElement): void;
  container?: HTMLElement;
  renderChildren(
    render: (args: {
      key: K;
      container: Element;
      getData: GetValue<T>;
      getIndex: GetValue<number>;
      onPointerDown(e: PointerEventBase, target?: Element): void;
      plugin(e: HTMLElement): void;
    }) => void
  ): void;
};
export function getClickPosition(
  e: PointerEventBase,
  container: Element = e.currentTarget as any
) {
  const p = container.getBoundingClientRect();
  return {
    x: e.pageX - p.x,
    y: e.pageY - p.y,
    width: p.width,
    height: p.height,
  };
}

export type SimpleDragData<K> = {
  // readonly startEvent: PointerEventBase;
  readonly id: K;
  //鼠标点相对拖拽块的位置
  readonly x: number;
  readonly y: number;
  //拖拽块的尺寸
  readonly width: number;
  readonly height: number;
  readonly dragX: AnimateSignal;
  readonly dragY: AnimateSignal;
  readonly activeContainer: StoreRef<Element | null>;
  readonly onDropEnd: StoreRef<boolean>;
  targetPlaceholder?: {
    readonly element: Element;
  };
};

function alaways0() {
  return 0;
}
export function simpleDragContainer<
  DragData extends SimpleDragData<K>,
  DragType,
  K = any,
>(arg: {
  measureAt?: 'pointer' | 'center';
  previewAnimateConfig?: DeltaXSignalAnimationConfig;
  changeIndexAnimate?: LayoutAnimateFun;
  setDragData: SetValue<DragData | undefined>;
  getDragData(): DragData | undefined;
  onDragFinish(d: DragData, accept?: AcceptData<DragData, DragType>): void;
}) {
  const measureAt = arg.measureAt || 'center';
  const out = buildContainer<DragData, DragType, K>({
    ...arg,
    getPreviewRef(n) {
      return n.targetPlaceholder?.element;
    },
    getActiveContainer(n) {
      return n.activeContainer.get();
    },
    getMeasurePositionDiff:
      measureAt == 'center'
        ? function (d, dir) {
            if (dir == 'x') {
              return d.width / 2 - d.x;
            } else {
              return d.height / 2 - d.y;
            }
          }
        : alaways0,
    getDragX(n) {
      return n.dragX.get();
    },
    setDragTo(x, n) {
      x.dragX.set(n.pageX);
      x.dragY.set(n.pageY);
    },
    getDragY(n) {
      return n.dragY.get();
    },
    getDropped(n) {
      return n.onDropEnd.get();
    },
    setActiveContainer(n, e) {
      n.activeContainer.set(e);
    },
    getDragId(x) {
      return x.id;
    },
    pluginFinishElement(d, e, key) {
      //必须由影子去表演迁移动画，因为不在容器内，可以会遮住。。。
      addEffect(() => {
        const r = e.getBoundingClientRect();
        Promise.all([
          d.dragX.animateTo(r.x + d.x, arg.previewAnimateConfig),
          d.dragY.animateTo(r.y + d.y, arg.previewAnimateConfig),
        ]).then(() => {
          arg.setDragData(undefined);
        });
      });
    },
  });
  return out;
}
