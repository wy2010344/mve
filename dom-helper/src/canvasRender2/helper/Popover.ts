import type { StateHolder } from 'mve-core';
import type { GetValue, PointKey, StoreRef } from 'wy-helper';
import { emptyArray, emptyFun } from 'wy-helper';
import type { EmptyFun } from 'wy-helper';
import {
  Fc,
  Node2,
  absoluteX,
  absoluteY,
  innerSize,
  merge,
  node2,
  resolveMessages,
  nodeMessageDefaults,
  sizeFromChildren,
  tfc,
} from '../Node';
import type { LayoutSize } from '../Node';
import type { Node2Arg } from '../NodeArg';
import { flex } from '../flex';
import type { Pop2, PopRegistry } from '../Pop';
import { usePopRegistry } from '../Pop';
import { globalMouse2Context } from '../tree/globalMouse';
import type {
  Placement,
  PlacementRect,
} from '../../canvasCore/Placement';
import { resolvePlacement } from '../../canvasCore/Placement';

/**
 * 面板放置参数（**不是节点消息**，工厂自消费——所以它们不会落到节点字段上，
 * 见 PORTING.md §4：`Node2Config` 不进 `p`）。
 */
export interface PopoverPlacement {
  /** 锚矩形（画布内坐标，通常取按钮的绝对矩形） */
  anchor: GetValue<PlacementRect>;
  /** 放置方向（默认 BottomStart：Dropdown / Popover 的传统行为） */
  placement: GetValue<Placement>;
  /** 面板与锚点在主轴上的间距 */
  gap: GetValue<number>;
}

/** 放置参数的兜底（对标 Kotlin 的默认值） */
export const popoverPlacementDefaults = {
  placement: (): Placement => 'BottomStart',
  gap: () => 4,
};

/**
 * 面板默认布局：竖向 flex。
 *
 * `notInLayout` 的节点必须自己给出尺寸：它进不了父布局，
 * `sizeFromParent` 里的 `layoutIndex()` 会直接抛错。所以默认给一个
 * 能"由子项推尺寸"的 flex（用户传入的 `layout` 优先，见 [merge]）。
 */
const defaultPanelLayout = flex({ direction: 'y' });

/** 浮层面板的节点参数（放置参数 + 普通节点参数） */
export interface PopoverArg extends Partial<Node2Arg>, PopoverPlacement {
  /** 面板内容 */
  children: readonly Fc[];
  /** 面板节点建好后回填（供"点外面关闭"读矩形）；工厂自消费，不进节点 */
  onPanel: (node: Node2) => void;
}

/**
 * 浮层面板（对标 Kotlin `helper/Placement.kt` 的使用方式）。
 *
 * - **不参与布局**（`notInLayout`）：它浮在主界面之上，不能反过来影响父布局；
 * - **位置自算**：`position` 直接经 [resolvePlacement] 得出（空间不足自动
 *   翻转 + 贴边），因此父布局的容器无需为它留位置；
 * - **尺寸由内容推导**：走默认尺寸逻辑（自己的布局），不写死。
 */
const popoverPanel = tfc(function (
  ctx,
  ref: StoreRef<Node2>,
  arg: PopoverArg
) {
  // 视口 = 父节点（根）的 inner：浮层与 TreeNode 同坐标系
  const view = ctx.getParent() as Node2;
  // 只取节点消息（放置参数 / children / onPanel 是配置，不进 p）
  const p = resolveMessages(arg, nodeMessageDefaults);
  node2.create(
    merge(
      {
        notInLayout: () => true,
        layout: arg.layout ?? defaultPanelLayout,
        children: arg.children ?? emptyArray,
        size(d: PointKey): LayoutSize {
          // 尺寸一律由自己的子项推导（不参与父布局，不能问父级要）
          return sizeFromChildren(ref.get(), d);
        },
        position(axis: PointKey): number {
          const node = ref.get();
          const at = resolvePlacement(
            arg.placement(),
            arg.anchor(),
            { width: node.width(), height: node.height() },
            {
              width: innerSize(view, 'x'),
              height: innerSize(view, 'y'),
            },
            arg.gap()
          );
          return axis === 'x' ? at.x : at.y;
        },
      },
      p
    )
  )(ref)(ctx);
  arg.onPanel(ref.get());
});

/** 点是否在矩形内（半开区间，与命中测试的约定一致） */
function inRect(rect: PlacementRect, x: number, y: number): boolean {
  return (
    x >= rect.x &&
    x <= rect.x + rect.width &&
    y >= rect.y &&
    y <= rect.y + rect.height
  );
}

function nodeRect(node: Node2): PlacementRect {
  return {
    x: absoluteX(node),
    y: absoluteY(node),
    width: node.width(),
    height: node.height(),
  };
}

export interface ShowPopoverArg extends Partial<Node2Arg> {
  /** 锚矩形（画布内坐标） */
  anchor: GetValue<PlacementRect>;
  /** 放置方向（默认 BottomStart） */
  placement?: GetValue<Placement>;
  /** 面板与锚点间距（默认 4） */
  gap?: GetValue<number>;
  /** 面板内容 */
  children: readonly Fc[];
  /**
   * 点面板 / 锚点之外时自动关闭（默认 true）。
   * 点锚点不算"外面"——那是调用方自己的按钮，由它决定是否切换开关。
   */
  dismissOnOutsideClick?: GetValue<boolean>;
}

/**
 * 弹出一个锚定浮层（下拉 / 右键菜单 / 气泡），返回关闭句柄。
 *
 * 只吃两样宿主能力（都是经 context 拿，拿不到就退化）：
 * - 浮层登记处（没有它就没有地方挂面板）；
 * - 全局鼠标（没有它就不做"点外面关闭"）。
 */
export function showPopover(
  ctx: StateHolder<Node2, readonly Node2[]>,
  arg: ShowPopoverArg
): EmptyFun {
  const found = usePopRegistry(ctx);
  if (!found) return emptyFun;
  const registry: PopRegistry = found;
  const placement = merge(arg, popoverPlacementDefaults);
  let panel: Node2 | null = null;
  const pop: Pop2 = registry.appendPop(
    popoverPanel.of({
      ...arg,
      anchor: arg.anchor,
      placement: placement.placement,
      gap: placement.gap,
      onPanel(node) {
        panel = node;
      },
    })
  );
  let unregister: EmptyFun = emptyFun;
  const mouse = ctx.consume(globalMouse2Context);
  const dismiss = arg.dismissOnOutsideClick ?? (() => true);
  if (mouse && dismiss()) {
    unregister = mouse.registerMouseDown((x, y) => {
      if (panel && inRect(nodeRect(panel), x, y)) return;
      if (inRect(arg.anchor(), x, y)) return;
      close();
    });
  }
  function close() {
    unregister();
    unregister = emptyFun;
    registry.removePop(pop);
  }
  return close;
}

export type { PopRegistry };
