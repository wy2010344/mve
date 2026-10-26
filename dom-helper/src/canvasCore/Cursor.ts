/**
 * 鼠标光标类型：枚举值即合法 CSS `cursor` 关键字，宿主直接
 * `canvas.style.cursor = type` 即可（原先两套各定义了一遍，值完全相同）。
 *
 * 纯枚举、零节点依赖 —— canvasRender / canvasRender2 与未来的树形态共用。
 */
export enum CursorType {
  DEFAULT = 'default',
  POINTER = 'pointer',
  TEXT = 'text',
}
