import type { StateHolder } from 'mve-core';
import type { PointKey } from 'wy-helper';
import { emptyFun } from 'wy-helper';
import type { EmptyFun } from 'wy-helper';
import { Fc, Node2, fc, innerSize, layoutSize, merge, node2 } from '../Node';
import type { LayoutDirection2, Node2Arg } from '../NodeArg';
import { createScroll, scrollContent } from '../Scroll';
import { flex, grow } from '../flex';
import type { Pop2, PopRegistry } from '../Pop';
import { toastLayer, usePopRegistry } from '../Pop';
import { postDelayed } from '../../canvasCore/Timer';

/** 一条 toast 的参数 */
export interface ToastArg {
  /** toast 内容（一段 Fc） */
  content: Fc;
  /** 自动关闭毫秒数（默认 3000）；<= 0 表示不自动关闭（由业务自己关） */
  durationMs?: number;
}

/**
 * 弹出一条 toast，返回"提前关闭"句柄（重复调用无副作用）。
 *
 * 到点自动关闭走 [postDelayed]——与渲染无关的时间驱动逻辑，
 * 即使之后没有任何重绘也会按时消失（这正是不能用"下一帧回调"的原因）。
 */
export function showToast(registry: PopRegistry, arg: ToastArg): EmptyFun {
  const toast = registry.appendToast(arg.content);
  const duration = arg.durationMs ?? 3000;
  const cancel = duration > 0 ? postDelayed(duration, close) : emptyFun;
  function close() {
    cancel();
    registry.removeToast(toast);
  }
  return close;
}

/**
 * 在当前节点的上下文里弹 toast。
 * 拿不到登记处（headless / 没有渲染器）时退化为"什么都不做"，不炸。
 */
export function showToastAt(
  ctx: StateHolder<Node2, readonly Node2[]>,
  arg: ToastArg
): EmptyFun {
  const registry = usePopRegistry(ctx);
  if (!registry) return emptyFun;
  return showToast(registry, arg);
}

/**
 * 容器默认布局：主轴横向（内容区因此经 grow 占满容器宽度）。
 *
 * 交叉轴（纵向）的对齐对内容区无效——内容区是滚动内容，纵向位置由
 * 滚动值接管（`scrollContent` 重写了滚动轴的 position），不参与容器布局。
 */
const defaultContainerLayout = flex({
  direction: 'x',
  alignFix: true,
});

/** 内容区默认布局：竖向堆叠、间距 10、横向居中（对标 Kotlin `contentAlignItem=center`） */
const defaultContentLayout = flex({
  direction: 'y',
  gap: 10,
  alignItem: 'center',
  alignFix: true,
});

/** Toast 容器自身的参数（容器布局 + 内容区布局，一般不用改） */
export interface ToastContainerArg extends Partial<Node2Arg> {
  /** 容器布局（默认主轴横向 + 交叉轴锁定） */
  layout?: LayoutDirection2;
  /** 内容区布局（默认竖排 + 居中 + 间距 10）：改它即可换堆叠方向 / 对齐 */
  contentLayout?: LayoutDirection2;
}

/**
 * Toast 容器（对标 Kotlin `helper/ToastContainer.kt`）。
 *
 * - **铺满窗口**：尺寸取父（根）节点的 inner，位置恒 0；
 * - **不参与布局**（`notInLayout`）：否则它会反过来撑大根节点的尺寸需求；
 * - **整层不拦截命中**（`acceptHit = false`）：点击穿透到主界面；单个 toast
 *   自己仍可命中（想要"可点的 toast"就把它做成普通节点即可）；
 * - **堆不下可滚动**：内容区尺寸由子项累加（不是容器高度），所以 toast
 *   堆到放不下时可在容器内滚动（与 Kotlin 的 SimpleScrollNode 一致）。
 *
 * 渲染器已经把这一层放好了，业务侧只需要 [showToast]。
 */
const toastContainerFc = fc(function (
  ctx,
  arg: ToastContainerArg & { registry: PopRegistry }
) {
  const p = merge(arg, {
    layout: defaultContainerLayout,
    contentLayout: defaultContentLayout,
  });
  // 父节点（根）在构造期就能拿到：尺寸要取它的 inner（对齐 Kotlin
  // `layoutParent?.innerSize(direction)`）。本节点要等 node2 装配完才存在，
  // 所以这里只能经 ctx.getParent() 取父级，不能读自身。
  const parent = ctx.getParent() as Node2;
  node2.of(
    merge(
      {
        notInLayout: () => true,
        acceptHit: () => false,
        size: (d: PointKey) => layoutSize(innerSize(parent, d), false),
        position: () => 0,
        children: [
          (innerCtx: StateHolder<Node2, readonly Node2[]>) => {
            const container = innerCtx.getParent() as Node2;
            const scroll = createScroll(container, 'y');
            scrollContent.of({
              scroll,
              exts: [grow({ argGrow: 1 })],
              layout: p.contentLayout,
              // 内容区同样不拦命中（对标 Kotlin `contentAcceptHit = false`）：
              // 否则整块内容区（铺满窗口）会吃掉所有点击，主界面点不动了。
              // 单个 toast 自己仍可命中——命中测试先深后浅，内容区只是"兜底不响应"。
              acceptHit: () => false,
              children: [toastLayer(arg.registry)],
            })(innerCtx);
          },
        ],
      },
      p
    )
  )(ctx);
});

/** 造一个 Toast 容器子表达式（渲染器在根节点 children 末尾展开） */
export function toastContainer(
  registry: PopRegistry,
  arg: ToastContainerArg = {}
): Fc {
  return toastContainerFc({ ...arg, registry });
}

export type { Pop2 };
