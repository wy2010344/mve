import type { ValueOrGetList } from 'mve-core';

/**
 * 两条与树形态无关的小工具（两套树共用）。
 *
 * 之所以能共用：它们只要求节点答出 `hide()` 与 `_index` 两个成员，
 * 不依赖任何节点类；ooc 侧原样表达，Rust 侧改成泛型约束即可。
 */

/** 展平嵌套的 children 列表，并按 `hide()` 过滤掉隐藏节点（构建期过滤） */
export function flatten<
  N extends {
    hide(): any;
  },
>(list: readonly ValueOrGetList<N>[], out: N[]): void {
  for (const child of list) {
    if (typeof child == 'function') {
      flatten((child as () => ValueOrGetList<N>[])(), out);
    } else if (!child.hide()) {
      out.push(child);
    }
  }
}

/** 重排兄弟序号：布局 / 命中 / 绘制都要按它索引，列表变动后必须重算 */
export function collectIndex<
  N extends {
    _index: number;
  },
>(list: readonly N[]): void {
  let index = 0;
  for (const node of list) {
    node._index = index++;
  }
}
