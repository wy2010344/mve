import type { EmptyFun } from 'wy-helper';
import {
  createLateSignal,
  emptyArray,
  PointKey,
  run,
  storeRef,
  StoreRef,
} from 'wy-helper';
import {
  MouseEvent2,
  Node2,
  defaultPosition,
  fc,
  getPadding,
  innerSize,
  merge,
  node2,
  size,
} from './Node';
import { Node2Arg } from './NodeArg';

/** 滚动条几何计算：滑块尺寸/偏移与滚动值的双向换算 */
export interface ScrollBarCalculate2 {
  /** 滑块尺寸（沿滚动方向） */
  readonly size: number;
  /** 滑块偏移（沿滚动方向） */
  readonly offset: number;
  /** 最大滚动距离 */
  readonly maxScroll: number;
  /** 滑块最大偏移（轨道长 - 滑块长） */
  readonly maxOffset: number;
  /** 指针位移 → 滚动值增量 */
  moveToScroll(delta: number): number;
  /** 滚动值增量 → 指针位移 */
  scrollToMove(delta: number): number;
}

/** 滚动状态（信号驱动）：值钳制在 [0, maxScroll]，变化经信号通知重绘 */
export interface Scroll2 {
  /** 滚动容器（内容与轨道的父节点） */
  readonly container: Node2;
  /** 滚动方向 */
  readonly direction: PointKey;
  /**
   * 外层滚动（同向嵌套时由内层滚到底后接续消费剩余量）。
   * 对标 Kotlin `Scroll.parentScroll`；null 表示到顶/到底就停。
   */
  readonly parentScroll: Scroll2 | null;
  /** 当前滚动值（钳制后） */
  value(): number;
  /** 直接设置（不钳制，读取时钳制） */
  setValue(v: number): void;
  /**
   * 相对滚动，返回**本层**真实滚动量。
   * 若本层已到边界，剩余量转交 [parentScroll]（嵌套滚动链）。
   */
  scroll(delta: number): number;
  /** 滚动条几何；不可滚动时返回 null */
  scrollBarSize(
    direction: PointKey,
    length?: number
  ): ScrollBarCalculate2 | null;
  /**
   * 订阅「滚动活动」：任何来源（滚轮 / 拖滑块 / 程序写值）改变位置后回调一次。
   *
   * 与 [Scroll2.value] 信号的区别是**不参与响应式派生**——监听者通常是副作用方
   * （浮层滚动条收到通知后浮现并重新计时消隐），不该在渲染过程中被同步读取。
   * 返回取消订阅句柄。
   */
  addActivityListener(listener: EmptyFun): EmptyFun;
}

/**
 * 滚动内容标记（放进**隐藏的** exts，而非节点字段）。
 * 与 flex 的 GrowChild/AlignChild 同一套扩展机制：经 findExt 识别，
 * 不污染节点结构本身 —— 强类型语言（如 Rust）给节点结构体加字段难以
 * 复刻，放进可扩展的 exts 集合后即可移植。
 */
export class ScrollContentExt {}

/** 共享单例：所有滚动内容节点复用同一个标记实例，无需每节点新建 */
export const scrollContentExt = new ScrollContentExt();

/** 节点是否为「滚动内容」（经 exts 里的 ScrollContentExt 识别） */
export function isScrollContentNode(node: Node2): boolean {
  return Boolean(node.findExt(ScrollContentExt));
}

/** 内容区尺寸：容器内第一个滚动内容子节点的外尺寸 */
export function contentSize(container: Node2, direction: PointKey): number {
  for (const child of container.children()) {
    if (isScrollContentNode(child)) {
      return size(child, direction);
    }
  }
  return 0;
}

/** 最大可滚动距离：内容尺寸 - 容器 inner 尺寸（负值归零） */
export function maxScroll(container: Node2, direction: PointKey): number {
  return Math.max(
    0,
    contentSize(container, direction) - innerSize(container, direction)
  );
}

/**
 * 创建滚动状态（对标旧版 new Scroll(container, direction)）。
 * 滚动值存放在传入的信号里（默认 `createLateSignal(0)`），
 * 变化经 wy-helper 信号批处理触发重绘。
 *
 * 这里只有一个可变状态（滚动值），其余全是纯派生 —— 所以 ooc 侧
 * 就是一个对象 + 一个 `storage ref`。
 */
export function createScroll(
  container: Node2,
  direction: PointKey = 'y',
  value = createLateSignal(0),
  parentScroll: Scroll2 | null = null
): Scroll2 {
  const get = value.get;
  const set = value.getOnlySet();
  const clamp = (v: number) =>
    Math.min(Math.max(v, 0), maxScroll(container, direction));
  /**
   * 活动监听者名单（非响应式：滚动条据此播放浮现动画）。
   * 通知时先复制一份——监听者可能在回调里同步取消订阅。
   */
  const activityListeners: EmptyFun[] = [];
  function notifyActivity() {
    activityListeners.slice().forEach(run);
  }
  const scroll: Scroll2 = {
    container,
    direction,
    parentScroll,
    value() {
      return clamp(get());
    },
    setValue(v: number) {
      const changed = v !== get();
      set(v);
      if (changed) notifyActivity();
    },
    scroll(delta: number): number {
      const cur = scroll.value();
      const next = clamp(cur + delta);
      const real = next - cur;
      set(next);
      // 这里绕过了 setValue（钳制已经算过一次），活动通知得自己补上——
      // 滚轮走的正是这条路，漏了它浮层滚动条就不会在滚动时浮现
      if (real !== 0) notifyActivity();
      // 本层吃不完的剩余量交给外层（内层先滚、到边界再带动外层）
      const rest = delta - real;
      if (rest !== 0 && parentScroll) {
        parentScroll.scroll(rest);
      }
      return real;
    },
    scrollBarSize(d: PointKey, length = 0): ScrollBarCalculate2 | null {
      const len = length > 0 ? length : innerSize(container, d);
      const v = innerSize(container, d);
      const c = contentSize(container, d);
      const m = maxScroll(container, d);
      if (m <= 0 || c <= 0) return null;
      const thumb = Math.max(20, (len * v) / c);
      const maxOffset = Math.max(0, len - thumb);
      const move = (maxOffset * scroll.value()) / m;
      return {
        size: thumb,
        offset: move,
        maxScroll: m,
        maxOffset,
        moveToScroll(delta: number) {
          return maxOffset > 0 ? (delta * m) / maxOffset : 0;
        },
        scrollToMove(delta: number) {
          return m > 0 ? (delta * maxOffset) / m : 0;
        },
      };
    },
    addActivityListener(listener: EmptyFun): EmptyFun {
      activityListeners.push(listener);
      return () => {
        const i = activityListeners.indexOf(listener);
        if (i >= 0) activityListeners.splice(i, 1);
      };
    },
  };
  return scroll;
}

/**
 * 容器上的滚轮接入（对标 Kotlin `SimpleScrollNode.onPointerWheel`）：
 * 沿命中链收到 wheel 时按方向消费，并 `stopPropagation()` 拦住外层。
 *
 * 用法：把返回值放进容器节点的参数对象
 * ```ts
 * const scroll = createScroll(container, 'y', undefined, parentScroll);
 * node2({ ..., mouseWheel: scrollWheel(scroll) })
 * ```
 *
 * 之所以是"返回一个消息实现"而不是"注册到全局"：滚轮必须走命中链，
 * 才能做到内层优先、到边界再接续外层（见 [Scroll2.parentScroll]）。
 */
export function scrollWheel(scroll: Scroll2): (event: MouseEvent2) => void {
  return event => {
    const delta =
      scroll.direction === 'y' ? event.wheelDeltaY : event.wheelDeltaX;
    if (delta === 0) return;
    scroll.scroll(delta);
    // 拦住外层：否则页面/父容器会同时滚动，形成"滚一格跳两格"
    event.stopPropagation();
  };
}

/** 滚动内容的参数消息：`scroll` 是唯一必填项，其余由 defaults 兜底 */
export interface ScrollContentArg extends Partial<Node2Arg> {
  /** 滚动状态：决定内容偏移（滚动轴整体平移 -value）与命中门控 */
  scroll: Scroll2;
}

/**
 * 滚动内容的参数兜底。
 *
 * `position` 是**节点相关**的默认值（要读父布局），所以不能写成静态单例，
 * 这里按节点闭包一份——ooc 侧同形：`defaults = { position(d) { defaultPosition (ref get) d } }`。
 */
function scrollContentDefaults(ref: StoreRef<Node2>) {
  return {
    /** 交叉轴位置：用户给了就用（merge 优先），没给走父布局默认 */
    position: (d: PointKey) => defaultPosition(ref.get(), d),
    /** 构建设置：与用户传入的 exts 合并 */
    exts: emptyArray as readonly unknown[],
  };
}

/**
 * 滚动内容节点（对标旧版 ScrollContent + renderScrollContent）：
 * - drawAtParent 重写：在父坐标系上按容器 inner 区裁剪，内容滚出视口的部分不绘制；
 * - 滚动轴位置恒为 `-scroll.value()` 叠加容器 padding 起点（交叉轴走默认布局位置）；
 * - acceptClip 把命中测试限制在容器 inner 区内（视口外的子节点不响应事件）。
 *
 * 用法（容器内，与 scrollBar 并列）：
 * ```ts
 * const scroll = createScroll(container, 'y');
 * scrollContent({ scroll, exts: [grow({ argGrow: 1 })], children: [...] })(ctx);
 * ```
 *
 * 滚轮不需要任何注册：scrollContent 自己挂载了 `mouseWheel`，沿命中链收到滚轮
 * 就消费（滚动条同理）。
 */
export const scrollContent = fc(function (ctx, arg: ScrollContentArg) {
  const ref = arg.nodeRef ?? storeRef(undefined!);
  const p = merge(arg, scrollContentDefaults(ref));
  node2(
    merge(
      {
        // 句柄经 arg.nodeRef 入场，node2 负责 ref.set(node)（对齐旧 tfc 的 node2.create(...)(ref)）
        nodeRef: ref,
        // 把"滚动内容"标记挂进 exts（对应 Kotlin `it is ScrollContent` 判定）
        exts: p.exts.concat([scrollContentExt]),
        // 滚轮沿命中链到达内容区时由本节点消费，并拦住外层（嵌套滚动的"内层优先"）
        mouseWheel: scrollWheel(p.scroll),
        // 滚动轴位置由 scroll 接管：容器 inner 原点（父 padding start）减去滚动值
        position(d: PointKey): number {
          if (d === p.scroll.direction) {
            const parent = ref.get().parent;
            const pad = parent ? getPadding(parent as Node2, d, 'start') : 0;
            return pad - p.scroll.value();
          }
          return p.position(d);
        },
        // x/y 相对父（容器）：仅容器 inner 区内可命中
        acceptClip(x: number, y: number): boolean {
          const parent = ref.get().parent;
          if (!parent) return false;
          const container = parent as Node2;
          const left = container.paddingInlineStart();
          const top = container.paddingBlockStart();
          return (
            x > left &&
            x < left + innerSize(container, 'x') &&
            y > top &&
            y < top + innerSize(container, 'y')
          );
        },
        // 父坐标系上的裁剪钩子：由父节点 draw 循环在 translate 前调用
        drawAtParent(ctx2: CanvasRenderingContext2D): void {
          const parent = ref.get().parent;
          if (!parent) return;
          const container = parent as Node2;
          ctx2.beginPath();
          ctx2.rect(
            container.paddingInlineStart(),
            container.paddingBlockStart(),
            innerSize(container, 'x'),
            innerSize(container, 'y')
          );
          ctx2.clip();
        },
      },
      p
    )
  )(ctx);
});
