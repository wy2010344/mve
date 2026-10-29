import { absoluteLayoutFun, memo, storeRef } from 'wy-helper';
import type { GetValue, Layout, PointKey, StoreRef } from 'wy-helper';
import type { ShareConfig, StateHolderWithNode } from 'mve-core';
import type { LayoutDirection2, Node2Arg } from '../NodeArg';
import { collectIndex, flatten } from '../../canvasCore/List';
import type { Fc, Node2, Node2Messages } from './protocol';
import { createLayout, layoutDep } from './geometry';
import { merge, nodeMessageDefaults, resolveMessages } from './messages';
import { tfc } from './tfc';

/** 恒定 getter（根节点位置默认值；与 `alawaysFalse` 同族） */
export const alaways0 = () => 0;
/** 共享的空 getter（`focusOrder` 默认值） */
export const alawaysNull = () => null;

/** 默认布局方向：绝对定位（对标 Kotlin AbsoluteLayout） */
export const absoluteLayoutDirection: LayoutDirection2 = {
  layout: () => absoluteLayoutFun,
};

/**
 * 节点自己提供的**结构 / 组合**消息（ooc 里的 `shell`）。
 *
 * 只放"必须知道节点自身或子节点"的消息：父子递归绘制、children 读取、
 * layoutChildren / layoutIndex、布局取用、扩展查找。其余参数消息一律由 `p`
 * 兜底，不必逐个写转发。
 *
 * 两处细节按 ooc 的约束收形：
 * - 结构方法只用 `this`（接收者）访问节点，不闭包 `node` 变量；
 * - "每节点一份"的缓存（layoutChildren / layoutX / layoutY 的 memo）延迟到
 *   首次发消息时创建，存进闭包单元——对应 ooc 对象里声明的 `storage ref`。
 *   节点对象一次成型（成员在字面量处固定），不能构造完再往上补。
 */
export function nodeShell(
  parent: Node2 | undefined,
  messages: Node2Messages,
  childGetter: StoreRef<GetValue<readonly Node2[]>>,
  exts: readonly unknown[],
  layoutDirection: LayoutDirection2
): Node2 {
  let layoutChildrenMemo: GetValue<readonly Node2[]> | null = null;
  let layoutXMemo: GetValue<Layout> | null = null;
  let layoutYMemo: GetValue<Layout> | null = null;
  const shell = {
    parent,
    // 索引是可写状态（collectIndex / layoutChildren 回填），先给确定初值，
    // 避免出现 undefined 中间态（Rust 侧为 usize 字段）
    _index: 0,
    _layoutIndex: 0,
    // children 是可写状态，走 ref（ooc 的 storage ref）：装配完成后再写入子表达式
    children: () => childGetter.get()(),
    // exts 只经闭包被 findExt 读取，节点上不落字段（对外只暴露 findExt 一个消息）
    findExt: <T>(cls: new (...vs: any[]) => T) =>
      exts.find(it => it instanceof cls) as T | undefined,
    index(this: Node2) {
      if (this.hide()) {
        throw new Error('已经隐藏不再显示');
      }
      if (parent) {
        parent.children();
      }
      return this._index;
    },
    draw(this: Node2, ctx2: CanvasRenderingContext2D) {
      // 参数对象只提供"画自己"那一段；父子递归是节点的结构职责
      messages.draw(ctx2, this);
      for (const child of this.children()) {
        if (child.skipDraw()) {
          continue;
        }
        ctx2.save();
        // 子节点在父坐标系上的预绘制钩子（对标 Kotlin Node.draw 里的
        // child.drawAtParent(canvas)）：裁剪等行为由子节点自己重写，基类零感知
        child.drawAtParent(ctx2);
        ctx2.translate(child.x(), child.y());
        child.draw(ctx2);
        ctx2.restore();
      }
    },
    layoutChildren(this: Node2) {
      return (layoutChildrenMemo ??= memo(
        () => this.children().filter(n => !n.notInLayout()),
        list => {
          let i = 0;
          list.forEach(row => {
            row._layoutIndex = i++;
          });
        }
      ))();
    },
    layoutIndex(this: Node2) {
      if (this.hide()) {
        throw new Error('已经隐藏不再显示');
      }
      if (this.notInLayout()) {
        throw new Error('当前节点不在Layout中');
      }
      this.parent?.layoutChildren();
      return this._layoutIndex;
    },
    layout(d: PointKey) {
      return layoutDirection.layout(d);
    },
    layoutX(this: Node2) {
      // 探测模式（LayoutAudit）下每节点单独一份、用后即弃：否则布局对象被缓存，
      // 子项根本不会被测量，依赖图会缺边
      if (layoutDep.probeMode) return createLayout(this, 'x')();
      return (layoutXMemo ??= createLayout(this, 'x'))();
    },
    layoutY(this: Node2) {
      if (layoutDep.probeMode) return createLayout(this, 'y')();
      return (layoutYMemo ??= createLayout(this, 'y'))();
    },
  };
  return shell as unknown as Node2;
}

/**
 * 装配节点：`p = merge(arg, defaults)` → `node = merge(shell, p)`，**一次成型**。
 *
 * 与 ooc 完全同构：
 * ```ooc
 * p = merge $ arg defaults;   // 参数对象 + 兜底对象 → 中间对象
 * n = merge $ shell p;        // 结构消息优先，其余消息落到 p（兜底）
 * ```
 * 返回的节点已经完整，构造后不再往它身上加任何成员；`children` 由调用方随后
 * 写进 ref（对应 ooc 的 `storage ref`）。
 * Rust 侧对应 `struct Node2 { shell 各字段, arg: Node2Messages }`，结构方法转调 `self.arg`。
 */
export function assembleNode(
  parent: Node2 | undefined,
  arg: Partial<Node2Arg>,
  childGetter: StoreRef<GetValue<readonly Node2[]>>
): Node2 {
  const p = resolveMessages(arg, nodeMessageDefaults);
  const shell = nodeShell(
    parent,
    p,
    childGetter,
    arg.exts ?? emptyArray,
    arg.layout ?? absoluteLayoutDirection
  );
  return merge(shell, p) as unknown as Node2;
}

/** 子表达式容器：把 Fc 列表交给当前上下文展开 */
export function buildChildren(
  ctx: StateHolderWithNode<Node2, readonly Node2[]>,
  children: readonly Fc[]
) {
  children.forEach(child => child(ctx));
}

/** 尚未接上子表达式的 children（构造期占位：节点在子节点建好之前就返回空表） */
export const emptyChildren = (): readonly Node2[] => emptyArray;
const emptyArray: readonly never[] = [];

export const nodeConfig: ShareConfig<Node2, readonly Node2[]> = {
  after: collectIndex,
  purifyList(list) {
    const newList: Node2[] = [];
    flatten(list, newList);
    return newList;
  },
};

/**
 * 最普通的节点工厂：没有组件语义，只有「参数消息 + 子节点」。
 * 其余节点（Rect / RichText / Scroll…）都在它之上再叠一层自己的消息。
 */
export const node2 = tfc(function (
  ctx,
  ref: StoreRef<Node2>,
  arg: Partial<Node2Arg>
) {
  const parent = ctx.getParent() as Node2;
  // 子表达式列表是构建设置（不是消息），由工厂自己消费
  const children = arg.children ?? emptyArray;
  // children 是可写状态：先给"还没有子节点"，装配完再把真实子表达式写进 ref。
  // 不构造后往节点上加成员（ooc 的对象成员在字面量处固定），所以走 storage ref。
  const childGetter = storeRef<GetValue<readonly Node2[]>>(emptyChildren);
  const node = assembleNode(parent, arg, childGetter);
  // 节点已完整、能作为父节点响应消息，此时再接真实子表达式
  childGetter.set(
    ctx.renderNode(
      node,
      function (this: StateHolderWithNode<Node2, readonly Node2[]>) {
        const it = this;
        buildChildren(it, children);
      },
      nodeConfig
    )
  );
  ctx.addNode(node);
  // ref 最后指向节点（对齐 Rust `Rc::new(...)` 收尾）：children 构建期不需要本节点，
  // 需要父节点时一律走 ctx.getParent()（如 createScroll(container)），不必提前 set。
  // 布局 / 绘制在整棵树建完之后才发生，届时 ref.get() 已就绪（ooc 侧同样：节点组装
  // 完成后再响应外部消息，不会在构建中途向未定型的节点发消息）。
  ref.set(node);
});
