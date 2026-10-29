/**
 * 几何基元的公共门面（只做 re-export，不放实现）。
 *
 * 实现拆在 `geom/` 下：
 * - `geom/rect`  点 / 矩形：纯数据 + 消息（`rectOf` 工厂，`unionRect` 组合子）
 * - `geom/path`  可录制路径（`createPath2` 工厂 + `appendRoundedRect` 助手）
 *
 * 之所以保留 `Geometry.ts` 这个名字：既有调用面的 `from './Geometry'` 不必改，
 * 也给 ooc / Rust 侧一个「照着看就够」的入口清单。
 */
export * from './geom/rect';
export * from './geom/path';
