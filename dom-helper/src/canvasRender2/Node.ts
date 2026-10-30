/**
 * canvasRender2 的公共门面（只做 re-export，不放实现）。
 *
 * 实现按职责拆在 `tree/` 下：
 * - `tree/protocol`  节点**消息契约**（Node2 / MouseEvent2 / Fc）——三侧共用的规格
 * - `tree/geometry`  尺寸 / 位置 / 绝对坐标 / 命中测试（纯消息）
 * - `tree/messages`  `merge` / `resolveMessages` / 兜底对象 `nodeMessageDefaults`
 * - `tree/tfc`       组件工厂 `fc`（`create(arg) => Fc`；句柄经 `arg.nodeRef` 传入）
 * - `tree/assemble`  `shell` + `assembleNode` + `node2`
 * - `tree/dispatch`  鼠标派发（捕获 → 冒泡）/ 光标派生（纯消息）
 * - `tree/focusWalk` 焦点遍历（纯消息，无副作用）
 * - `tree/layoutAudit` 布局依赖审计（探测模式 + 边配对判环，只读）
 *
 * 之所以保留这一层：`from './Node'` 是既有调用面的公开名字，模块拆分不应
 * 逼所有使用方改 import；也给 ooc / Rust 侧一个"照着看就够"的入口清单。
 */
export * from './tree/protocol';
export * from './tree/geometry';
export * from './tree/messages';
export * from './tree/tfc';
export * from './tree/assemble';
export * from './tree/dispatch';
export * from './tree/focusWalk';
export * from './tree/layoutAudit';
