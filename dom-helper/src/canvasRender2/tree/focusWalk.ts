import type { NodeHit2 } from './geometry';
import type { Node2 } from './protocol';

/**
 * 焦点遍历（TS 与 ooc 共用的**纯消息**流程）。
 *
 * 全是"问节点"的操作：`hide()` / `children()` / `focusable()` / `focusOrder()` /
 * `focusTrap()` / `parent`。副作用（改全局焦点信号、同步 DOM 焦点）留给调用方，
 * 所以这些函数可以原样搬到 ooc，也可以直接单测。
 */

/** 文档序收集全部可聚焦节点（跳过隐藏子树） */
export function focusableList(root: Node2): Node2[] {
  const list: Node2[] = [];
  const walk = (n: Node2) => {
    if (n.hide()) return;
    if (n.focusable()) list.push(n);
    for (const c of n.children()) walk(c);
  };
  walk(root);
  return list;
}

/** 最近的外层焦点圈禁容器（自身算起；无则 null） */
export function closestTrap(from: Node2): Node2 | null {
  let cur: Node2 | null = from;
  while (cur) {
    if (cur.focusTrap()) return cur;
    cur = (cur.parent ?? null) as Node2 | null;
  }
  return null;
}

export function isDescendantOf(n: Node2, ancestor: Node2): boolean {
  let cur: Node2 | null = (n.parent ?? null) as Node2 | null;
  while (cur) {
    if (cur === ancestor) return true;
    cur = (cur.parent ?? null) as Node2 | null;
  }
  return false;
}

/**
 * 下一个该聚焦的节点（Tab / Shift+Tab，对标 Kotlin moveFocus）。
 *
 * 焦点在 `focusTrap` 子树内时只在圈内循环，否则全局循环；
 * `focusOrder` 显式排序优先（未指定者保持文档序，读取式、每项只求值一次）。
 * 返回 null 表示没有可聚焦节点（调用方决定是否 preventDefault）。
 */
export function nextFocusNode(
  root: Node2,
  current: Node2 | null,
  forward: boolean
): Node2 | null {
  const all = focusableList(root);
  if (all.length === 0) return null;
  let scope = all;
  const trap = current ? closestTrap(current) : null;
  if (trap) {
    const inTrap = all.filter(n => n === trap || isDescendantOf(n, trap));
    if (inTrap.length) scope = inTrap;
  }
  // focusOrder 显式排序优先（未指定者保持文档序）
  const ordered = scope.map((n, i) => ({ n, i, order: n.focusOrder() }));
  if (ordered.some(it => it.order != null)) {
    scope = ordered
      .sort((a, b) => {
        const ao = a.order ?? Number.MAX_SAFE_INTEGER;
        const bo = b.order ?? Number.MAX_SAFE_INTEGER;
        return ao === bo ? a.i - b.i : ao - bo;
      })
      .map(it => it.n);
  }
  const idx = current ? scope.indexOf(current) : -1;
  if (idx < 0) {
    return forward ? (scope[0] ?? null) : (scope[scope.length - 1] ?? null);
  }
  return (
    scope[(idx + (forward ? 1 : -1) + scope.length) % scope.length] ?? null
  );
}

/** 命中链中最深的可聚焦节点（叶子优先，与 Kotlin focusable 查找一致） */
export function focusableLeafOf(path: readonly NodeHit2[]): Node2 | null {
  for (let i = path.length - 1; i >= 0; i--) {
    const n = path[i].node;
    if (n.focusable() && !n.hide()) return n;
  }
  return null;
}
