/**
 * 点与轴对齐矩形（对标 Kotlin PointF / RectF）：**纯数据 + 消息**。
 *
 * 这里没有 class：`rectOf(...)` 是工厂，返回的对象自己回答
 * `width()` / `height()` / `centerX()` / `contains(x,y)` 这些消息。
 * 派生值一律写成**零参方法**而不是 getter —— ooc 的计算成员就是 `=>`，
 * 没有「属性 / 方法」的区分，写成方法才能一比一搬过去：
 *
 * ```ooc
 * rectOf = [l t r b => {
 *     left = l, top = t, right = r, bottom = b,
 *     width => (this right) - (this left),
 *     height => (this bottom) - (this top),
 *     contains(x, y) { (x >= (this left)) && (x <= (this right)) && ... }
 * }];
 * ```
 *
 * `unionRect` 是「两个矩形」的组合子，不是单个矩形的能力，所以留成自由函数
 * （ooc: `unionRect $ a b`）。
 */

/** 二维点（对标 Kotlin PointF） */
export interface PointF {
  readonly x: number;
  readonly y: number;
}

export function pointF(x: number, y: number): PointF {
  return { x, y };
}

/** 轴对齐矩形（全局 / 局部坐标都用它，语义由调用方决定） */
export interface Rect2 {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  /** 宽（right - left） */
  width(this: Rect2): number;
  /** 高（bottom - top） */
  height(this: Rect2): number;
  /** 水平中心 */
  centerX(this: Rect2): number;
  /** 垂直中心 */
  centerY(this: Rect2): number;
  /** 点是否在矩形内（含边界） */
  contains(this: Rect2, x: number, y: number): boolean;
  /** 是否与另一矩形相交（不重叠即 false，贴边不算相交） */
  intersects(this: Rect2, other: Rect2): boolean;
  /** 平移 */
  offset(this: Rect2, dx: number, dy: number): Rect2;
  /** 四边各外扩 delta（负数即内缩） */
  inflate(this: Rect2, delta: number): Rect2;
}

/** 构造矩形（对应 ooc 的对象字面量） */
export function rectOf(
  left: number,
  top: number,
  right: number,
  bottom: number
): Rect2 {
  return {
    left,
    top,
    right,
    bottom,
    width() {
      return this.right - this.left;
    },
    height() {
      return this.bottom - this.top;
    },
    centerX() {
      return (this.left + this.right) / 2;
    },
    centerY() {
      return (this.top + this.bottom) / 2;
    },
    contains(x, y) {
      return (
        x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
      );
    },
    intersects(other) {
      return (
        this.left < other.right &&
        this.right > other.left &&
        this.top < other.bottom &&
        this.bottom > other.top
      );
    },
    offset(dx, dy) {
      return rectOf(
        this.left + dx,
        this.top + dy,
        this.right + dx,
        this.bottom + dy
      );
    },
    inflate(delta) {
      return rectOf(
        this.left - delta,
        this.top - delta,
        this.right + delta,
        this.bottom + delta
      );
    },
  };
}

/** 矩形并集（SelectionManager.selectedRect 的聚合用） */
export function unionRect(a: Rect2, b: Rect2): Rect2 {
  return rectOf(
    Math.min(a.left, b.left),
    Math.min(a.top, b.top),
    Math.max(a.right, b.right),
    Math.max(a.bottom, b.bottom)
  );
}
