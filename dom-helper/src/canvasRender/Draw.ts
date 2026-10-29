/**
 * 颜色与圆角绘制（与树形态无关的基础设施）。
 *
 * 实现在共用层 `src/canvasCore/Draw.ts`，两套树（canvasRender / canvasRender2）
 * 共用同一份；本文件只是旧路径的门面，保持对外 API 不变。
 */
export * from '../canvasCore/Draw';
