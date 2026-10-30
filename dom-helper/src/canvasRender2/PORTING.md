# canvasRender2 → ooc 移植约定

本目录的 TS 代码是为「一比一搬去 ooc」写的，不是为 TS 写得舒服写的。规则只有一条：**只向对象发消息，缺省靠 merge 兜底**。下面把这条规则落成可执行的约定。

## 0. 设计基准：Flutter / SwiftUI / Jetpack Compose

**这套引擎对标的是现代声明式响应式框架，不是 Web/DOM/CSS。** `canvasRender` v1 及本目录的 TS 运行时只是「当前宿主 + 验证载体」，不构成语义标准。做设计选择时按下列顺序取参照：

| 主题       | 参照（优先）                            | 明确**不要**照搬的 Web 语义                                   |
| ---------- | --------------------------------------- | ------------------------------------------------------------- |
| 组合       | Compose `@Composable` / SwiftUI `body` / Flutter `build()` | `appendChild` 式命令式构建                              |
| 状态       | `mutableStateOf` / `@State` / `ValueNotifier` | DOM 属性即状态、手动 `setAttribute` 刷新                  |
| 数据流     | 单向（状态 → 声明树 → 绘制）            | 双向 DOM 事件回写、隐式全局事件总线                       |
| 布局       | 约束驱动、单遍测量（Flutter `BoxConstraints` / Compose `MeasurePolicy`） | CSS 盒模型层叠、`position: absolute` 满天飞、百分比链 |
| 命中/手势  | 命中测试 → 手势系统（Flutter arena / Compose pointer passes） | `preventDefault` / `stopPropagation` 作为**语义**（本引擎只用它们做传播机制） |
| 文本/选区  | 原生文本编辑器语义（Compose `TextField` / Flutter `EditableText`） | contenteditable、`Selection` DOM API                  |
| 外观       | 显式绘制属性（颜色/圆角/阴影作为节点消息） | CSS 选择器、类名、样式表层叠                            |

具体落点：

- **`Fc` 就是 `@Composable` / `View`**：纯函数、可组合、不含实例状态；状态一律走 `StoreRef`（= `mutableStateOf` / `@State`）。
- **`Node2` 是 retained 渲染树**（≈ Flutter RenderObject / Compose LayoutNode）：结构消息 + 布局/绘制，不承载业务状态。
- **捕获/冒泡只是传播机制**，不是语义目标。需要"拦截"时像 Flutter 手势那样考虑是否该用命中测试/手势竞争，而不是无脑 `stopPropagation`。禁止引入 `preventDefault` 这类 DOM 概念到节点语义里。
- **滚轮/滚动**按 Flutter `Scrollable` 的语义：容器只消费与自身滚动轴同向的增量，交叉轴增量交还外层（见 §4「滚轮」）。
- 新增能力若在 Flutter/Compose/SwiftUI 里有对应概念，先对齐它的**语义**（例如 `ScrollPhysics`、`Semantics`、`focus`/`FocusScope`），再考虑落地形式。

## 1. 三条硬规则

1. **不写解构**（`const { a, b = 1, ...rest } = arg`）。改成 `p = merge(arg, defaults)`，之后 `p a`
   / `p b` 一定答得出来。
2. **不做成员探测**（`p.draw ? … : …`、`?.()`、`?? default`、`typeof x === 'function'`）。缺省行为一律写进 defaults；"可能没有"只允许用
   **nil 值**表达（`p spans` 返回 nil 表示没给）。
3. **不 spread 未知成员**（`{ ...rest, draw }`）。节点工厂只做两次 merge，成员来源清清楚楚。

## 2. 节点工厂的三步装配

```ts
const p = merge(arg, xxxNodeDefaults); // ① 参数 + 兜底 → 每条参数消息都答得出来
node2(
  merge(
    {
      /* 节点自有消息 */
    },
    p,
    { nodeRef } // 需要节点句柄时：调用方自建 storeRef 填进 arg.nodeRef
  ) // ② 自有消息优先，其余落到 p（nodeRef 透传最底层 node2）
)(ctx); // ③ 组装（结构消息由 shell 提供，node2 末尾 ref.set(node)）
```

```ooc
p = merge $ arg xxxNodeDefaults;
node2 create $ (merge $ { draw { … } } p) ref ctx;
```

对应关系：

| TS                                            | ooc                                    |
| --------------------------------------------- | -------------------------------------- |
| `merge(a, b)`（a 优先、b 兜底，两侧成员都在） | `merge $ a b`                          |
| `fc(f)` 的 `component(arg)`（直接返回 `Fc`）   | 同形；句柄经 `arg.nodeRef` 传入        |
| `defaults` 里的 `this.xxx()`                  | `this xxx`（`this` 回读整条 merge 链） |
| `defaults` 里的闭包（`ref.get()`）            | 对象字面量里声明的 `storage ref`       |

**所有组件统一用 `fc`。** `fc(f)` 的 `f` 收 `(ctx, arg, ...vs)`，`component(arg)` 直接返回
`Fc`（对标 Compose 无状态 `@Composable` / SwiftUI `View` / ooc 的 composable）。需要节点
句柄时，调用方自建 `storeRef` 填进 `arg.nodeRef`，最底层 `node2` 负责 `ref.set(node)` 收尾；
组件内部读自身尺寸/位置用 `arg.nodeRef!.get()`（延迟求值，构建末尾才就绪）。不再有 `of` /
`create` 两段式柯里化——与 ooc「组件即普通函数、参数直接传」完全同形，便于迁移。

**`this` 回读**只在 defaults 里用一次：`maxLines` 的默认值依赖同层的 `singleLine`，写成
`maxLines(this) { this.singleLine() ? 1 : INT_MAX }`——ooc 里就是
`maxLines { #guard (this singleLine); 1 #else; INT_MAX }`。其余 defaults 都是常量，不碰 `this`。

## 3. 目录与文件

| 文件                                                          | 职责                                                                | ooc 侧对应                     |
| ------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------ |
| `Node.ts`                                                     | 门面，re-export `tree/*`                                            | 一个入口文件                   |
| `NodeArg.ts`                                                  | 参数消息契约 `Node2Messages` + 构建设置 `Node2Config`               | `#type`                        |
| `tree/protocol.ts`                                            | 节点消息契约、`MouseEvent2`、`Fc`                                    | `#type` + 事件对象             |
| `tree/geometry.ts`                                            | 尺寸/位置/绝对坐标/命中链 + **布局成环诊断**（纯消息）              | 直接照抄，全是消息             |
| `tree/messages.ts`                                            | `merge` / `resolveMessages` / `nodeMessageDefaults`                 | 宿主 `merge` + 顶层 defaults   |
| `tree/tfc.ts`                                                 | `fc` 组件工厂（`create(arg) => Fc`；句柄经 `arg.nodeRef`）            | 同形（`storage ref`）          |
| `tree/assemble.ts`                                            | `nodeShell` + `assembleNode` + `node2` 工厂                         | 节点骨架 + 工厂                |
| `tree/dispatch.ts`                                            | 指针派发（8 类型 × 捕获/冒泡）、光标派生                            | 照抄                           |
| `tree/focusWalk.ts`                                           | Tab 遍历（圈定/排序）                                               | 照抄                           |
| `tree/pointer.ts`                                             | 指针状态机（连击/双击选词/三击选段/拖选）                           | 照抄（入参是纯数据）           |
| `tree/keyboard.ts`                                            | 键盘路由规则（快捷键、Tab 门槛）                                    | 照抄                           |
| `tree/globalMouse.ts`                                         | 全局鼠标注册表 + `dragMouse`                                        | 照抄（Set → 数组/Map）         |
| `geom/rect.ts`                                                | `rectOf` 工厂 + `unionRect`                                         | 对象字面量（派生值写成 `=>`）  |
| `geom/path.ts`                                                | `createPath2` 录制器                                                | 对象 + `storage ref` 存命令    |
| `selection/selectable.ts`                                     | `SelectableExt` 标记、`selectableDefaults`、树遍历                  | 标记值 + defaults              |
| `selection/manager.ts`                                        | `createSelectionManager(source)`：范围分配与聚合                    | 对象 + memo                    |
| `editable/params.ts`                                          | 编辑器参数消息 + defaults                                           | `#type` + defaults             |
| `editable/view.ts`                                            | 显示层（占位/掩码/tab）逻辑↔显示索引                                | 纯函数/对象                    |
| `editable/paragraph.ts`                                       | 段落缓存 + WASM 释放                                                | 桥接段落对象                   |
| `editable/caret.ts`                                           | 光标几何（矩形/行盒/字形位置）                                      | 纯函数，只向段落发消息         |
| `editable/selectable.ts`                                      | 编辑器作为可选文本区域                                              | 能力对象                       |
| `editable/editor.ts`                                          | 编辑器状态机（光标/编辑/键盘/IME/撤销）                             | 对象 + `storage ref`           |
| `RectNode` / `ImageNode` / `RichTextNode` / `WrappedTextNode` | 节点工厂（文本支持 `noWrap` 单行不折行）                            | 见 §2                          |
| `Scroll` / `ScrollBar`                                        | 滚动状态 + 内容/轨道/滑块                                           | 见 §2                          |
| `Scroll` / `OverlayScrollBar`                                 | 同上，macOS 浮层式（不占布局 + 自动隐藏）                           | 见 §2，定时器/帧回调是宿主能力 |
| `Renderer.ts` / `ImeInput.ts`                                 | 宿主绑定（DOM 事件、textarea）                                      | **不用照搬**，ooc 写自己的宿主 |
| `Focus.ts`                                                    | 焦点 / 按压态 / 修饰键信号、`EditableTextHandle` 契约、全局按键旁听 | 信号 + `#type`                 |
| `TextDefaults.ts`                                             | 主题默认色（`text()` / `setText(v)`）                               | 两个 `storage ref` + 消息      |

## 4. 几个必须知道的语义

**`size` 与 `width` 不是一回事。** `width()` = `size('x')` + padding（或调用方显式传的 `width`
直接盖掉 `width()` 消息）；`size()` 只用来表达「内容推导的尺寸」。所以工厂要改尺寸时**重写
`size`**，不要重写 `width`——否则布局测量（走 `width()`）和绘制会对不上。`ScrollBar` 就是按这条改的。

**`parent` 是可能为 nil 的普通字段**，不是"成员不存在"：`(n parent)` 拿 nil 即可判断。

**指针消息是 8×2 条**：`mouseDown / mouseUp / mouseMove / mouseClick / mouseWheel / mouseContextMenu / mouseDoubleClick`（`cancel`
复用 `mouseUp` 那组），每条都有 `xxxCapture` 版本。捕获阶段根 → 叶、冒泡叶 → 根，`stopPropagation()`
即整体中断。

**滚轮必须走命中链**（不要另开全局注册表）：`scrollContent` / `scrollBar` 自带
`mouseWheel = scrollWheel(scroll)`，内层先滚、到边界再由 `Scroll2.parentScroll` 接续外层，然后
`stopPropagation()` 拦住祖先。这样嵌套滚动不需要任何"谁先注册"的约定。

**文本原点是三元组**：`textOriginX/Y`
含 padding、单行墨迹补偿（`inkShiftYOf`）与无限宽对齐平移。绘制、选区矩形、`positionForPoint`、光标矩形**必须共用**同一个原点，否则"看到的字"和"点到的位置"会错开。

**`exts` 只经 `findExt` 暴露。** 标记类（`SelectableExt` / `EditorHandleExt` / `ScrollContentExt` /
flex 的 `GrowChild`）由 JS 侧定义、ooc 侧当作不透明值传进 `findExt`
即可（`node findExt SelectableExt`），不要试图在 ooc 里复刻 `instanceof`。

**能力对象每条消息都要答得出来。** 没有分词能力的实现不要漏写 `wordRangeAt`，而是
`merge $ { … } selectableDefaults`，由兜底返回 nil。

**`p` 不是节点。** `p` 只回答**参数消息**（`size` / `position` / `padding`
/ 鼠标钩子…），不回答结构消息（`parent` / `layoutX` / `children` / `draw`
的父子递归）。要"父节点的位置"必须经**节点**去问：`ref.get().parent` → 再发 `x()`。 `ScrollBar`
的滑块曾把
`defaultPosition(ref.get(), axis)`（那是**轨道**在容器里的位置）当成自己的局部坐标，结果滑块被推到轨道外、看上去就是"拖拽条不出现"——
`position` 消息问的永远是「我相对我父节点在哪」。

**纯类型不进运行时导出。** 接口 / 类型别名在 ESM 里会被擦除，
`import { SelectionManager2 } from '…' ` 在运行期是拿不到的（工厂函数 `createSelectionManager`
才是值）。外部只用**值**具名导入。

**组合输入不是已上屏文本。** `compositionBase` 记住被替换的原文，每次组合更新重写那一段； `commit`
保留已上屏文本，`endComposition(true)` 才还原。移植时这段照抄，别改顺序。

## 5. 需要宿主/桥接的（ooc 侧自己实现）

- **CanvasKit 段落**（`PlatformParagraph`
  是 class）：ooc 侧经桥接拿到同形对象（`width/height/getRectsForRange/getLineMetrics/getGlyphPositionAtCoordinate/delete`），
  `editable/caret.ts` 与 `editable/paragraph.ts` 的调用面就是它。
- **撤销栈**（`canvasCore/UndoRedo` 的 class 家族，与 canvasRender
  v1 共用）：ooc 侧按「构造 → 工厂」映射（`undoRedo $ 100`、`textState $ t c`、`insertTextAction $ pos t`）。
- **信号 / context / storage ref**：`createSignal` / `createContext` /
  `storage ref`，bridge 已提供。

## 6. 建议的移植顺序

1. `geom` → `tree/protocol` + `tree/messages` + `tree/assemble`（骨架能跑起来）
2. `tree/geometry` / `dispatch` / `focusWalk`（纯消息，最容易对齐）
3. `RectNode` → `WrappedTextNode` → `RichTextNode`（先无文本、再单片段、再多片段）
4. `tree/pointer` + `tree/keyboard`（交互规则）
5. `Scroll` + `ScrollBar`
6. `editable/*`（最后做，依赖段落桥接）

## 7. 可移植性体检（判据 / 命中 / 结论）

判据都是「ooc / Rust 里没有对应物」的写法。全量扫过 `tree/` `geom/` `selection/`
`editable/` `canvasCore/`：

| 判据 | 命中 | 结论 |
|---|---|---|
| 反射枚举成员（`Object.keys` / `for…in`） | 仅 `tree/messages` 的 `merge` / `resolveMessages` | ✅ 就是 §3 规定的两个宿主辅助 |
| 对节点「读属性」（`node[key]()` / `{...node}` / `node.x?.()`） | 0 | ✅ 全部走消息（`this.parent?.layoutChildren()` 是字段级 `Option`，Rust 是 `if let Some`） |
| `instanceof` | 3 处：ext 标记匹配、`LayoutError`、`bytes instanceof ArrayBuffer` | ✅ 前者 ooc 用内部 Symbol，中者按错误码，后者是平台分支 |
| `class … extends` | 1 处：`LayoutCycleError extends Error` | ✅ 只是错误类型，无行为继承 |
| `as any` / `as unknown as` | 2 处装配收尾（结构 → 名义）、3 处 `merge` 家族、1 处 `navigator` | ✅ 全是类型系统缺口，运行期无魔法 |
| 直接触达宿主定时器 | 原 1 处（编辑器光标闪烁 `setInterval`） | ⚠️ 已改为 `Timer.repeatEvery`（宿主可替换，见下） |
| 排序 / 去重 / 区间运算 | `normalizeIn` / `alignIn` / `setRangeIn` / `resolvePlacement` | ✅ 纯函数，可逐行照抄 |

**必须逐字段、不能枚举的两处**（枚举键在 ooc 里根本不存在）：

1. `tree/messages.merge` / `resolveMessages` —— 装配期的 `p = merge $ arg defaults`；
2. `editable/richSegments.styleEq` —— 逐字段比较（`decoration` 再按值比
   `underline` / `lineThrough`）。原先用 `Object.keys` 枚举，Rust 侧无法直译，已改。

**宿主能力清单**（引擎只表达意图，实现由宿主注入）：

| 能力 | 位置 | 浏览器 | Kotlin / ooc |
|---|---|---|---|
| 延时 | `Timer.postDelayed` | `setTimeout` | 协程 `delay` / 虚拟时钟 |
| 周期 | `Timer.repeatEvery` | `setInterval`（node 下自动 `unref`） | 协程 `while + delay` |
| 取字节 | `ImageLoader.setFetcher` | `fetch` | OkHttp / 协程 |
| 剪贴板 | `Clipboard.*Async` | `navigator.clipboard` | 平台 API |
| 段落 | `PlatformParagraph` | CanvasKit | Skia Paragraph |

**规模与依赖**：

| 层 | 行数 | 是否依赖宿主 |
|---|---|---|
| `tree/`（协议 + 几何 + 派发 + 焦点 + 指针 + 键盘 + 审计） | ~2.5k | 否（只读 `engineGlobal` 的信号） |
| `geom/` | ~0.4k | 否 |
| `selection/` | ~0.4k | 否（`Map<Selectable2, …>` 在 Rust 换成按节点序号的 `HashMap`） |
| `editable/` | ~1.6k | 仅段落桥接 + `repeatEvery` |
| `canvasCore/` | ~1.6k | `Paragraph` / `Clipboard` / `Timer` / `ImageLoader` 四处平台分支，其余纯逻辑 |

Rust 侧两个保持形状的提醒：

- `SelectionManager` 的优先级链是「读信号 → 纯派生」，Rust 侧保持 `fn selected(&self)` 现算，
  **不要缓存成字段**（缓存就要处理失效，正好是这套设计刻意避开的东西）；
- `editable/editor` 是「闭包结构体」（`createEditableEditor` 返回一组闭包），
  Rust 侧落成 `struct Editor` + `impl`：字段就是那些 `let` 绑定的信号，
  方法体与闭包一一对应，不需要额外抽象。

## 8. 尺寸来源规则（防成环）

布局只有两种尺寸来源：**内容撑开**（向子节点要）与**向上索要**（向父级要）。
默认值全部选前者，这是「父要子 / 子要父」模型下唯一不会自相矛盾的组合：

| 参数 | 默认 | 含义 | 结论 |
|---|---|---|---|
| `direction` | `'y'` | 主轴纵向（同 Flutter / Compose 的 Column 优先） | 保持 |
| `directionJustify` | `'grow'` | 主轴 = 子节点撑开（= wrap content，Compose `Column` 默认） | 保持 |
| `alignItem` | `'center'` | 交叉轴居中（Flutter / SwiftUI 交叉轴默认也是 center；Compose 是 start） | 保持 |
| `alignFix` | `false` | 交叉轴 = 内容撑开 | 保持 |

**三个会把来源反转成「向上索要」的入口**（坑都在这里，默认值不背锅）：

| 入口 | 触发写法 | 来源变成 | 前置条件（不满足就成环 / 崩） |
|---|---|---|---|
| 容器漏写 `layout` | 带 children 却没给 `layout` | 绝对布局，`allowSizeFromChildren()===false` | **无条件崩**：绝对布局的 `childSize` 直接抛错。必须补 `layout: flex({...})` |
| 交叉轴 `alignFix` | `flex({ ..., alignFix: true })` | `inside.innerSize()`（父级分配） | 该轴须有确定来源：自身显式尺寸，或父级在同轴上 `stretch` 分配 |
| 主轴出现 grow 子节点 | 子节点带 `grow({ argGrow: 1 })` | `inside.innerSize()`（父级分配） | 父级该轴须有确定尺寸（显式 / 由更外层分配） |

判据一句话：**父级某轴的尺寸来自子节点时，子节点就不能再向父级要同一根轴的尺寸**。

两道护栏都在 `tree/geometry.ts` 的 `sizeFromParent`（唯一的"子回读父"入口），
且都在真正回读**之前**触发，所以错误信息能点名节点：

1. **提前判环**：若 `layoutValue(parent, d).allowSizeFromChildren()` 为真（父级该轴
   也来自子节点），直接抛 `LayoutCycleError`，给出父子节点 + 轴 + 修法。
   不这样做的话，环往往先被 wy-helper 的 `memo` 拦下，退化成"循环调用 memo"
   这种指不到对象的报错。
2. **失败补上下文**：回读失败（如绝对布局的"没有子节点的尺寸"、
   StackLayout 的 "child should have it's own size"）时，用 `enrichSizeError`
   补上父子节点名、轴和三条排查顺序，而不是让裸错误飘出去。

ooc / Rust 侧照抄这两条即可：`allowSizeFromChildren` 是 `Layout` 的消息之一，
`enrichSizeError` 只是拼字符串。

### 8.1 提前判环的两条例外（别误伤）

`allowSizeFromChildren()` 为真只说明「父级该轴的尺寸**总体上**来自子节点」，
不代表**这一个**子节点被读。以下两类子节点不该扣成环的帽子：

| 例外 | 为什么不是环 | 当前处理 |
|---|---|---|
| `notInLayout: () => true` | 不在 `layoutChildren()` 里，父级测量时根本不读它 | 已排除：判环前先查 `inLayoutChildren`（纯结构消息） |
| 带 `align(...)` 自对齐 / `ignoreFlex(...)` 的子节点 | `StackLayout` 的 `size` 与 `FlexLayout` 的 `flexChildInfo` 都会跳过它们 | **未排除**：判环会误报。真出现了请给该子节点显式尺寸，或改走 `alignItem:'stretch'` |

`align` / `ignoreFlex` 的例外之所以没修：判断需要 `findExt(AlignChild)`，而 ext 类
在 `canvasCore/FlexLayout`，`tree/geometry` 是纯消息层，不该反向依赖它。真要修，
正解是把 READ 边也改成结构式（见 8.2），那时这条例外自然消失。

### 8.2 探测模式：READ 边的归属（TS 与 Kotlin 的做法不同）

审计（探测模式）靠「ASK 边 + READ 边配对」判环，所以**每一处"父级读子项尺寸"
都必须把边记到父级自己头上**。两侧实现方式不同，迁移时别照错：

| | TS | Kotlin |
|---|---|---|
| 实现 | 动态 `readers` 栈：读子项的代码要自己包 `withReader(node, …)` | 结构式：布局对象持有 `ownerNode`，在 `outerSize(n)` 里记 `probeRead(owner, n, d)` |
| 漏写后果 | 边记到「此刻正在测量的外层祖先」上 → `(祖父, 孙)`，与 ASK 的 `(父, 子)` 配不上 → **漏报** | 不可能漏（归属由结构决定） |

TS 侧目前有三处入口，**三处都必须包 `withReader`**（缺一处就漏报一类）：

1. `defaultSize` → `withReader(node, () => x.sizeFromChildren())`
2. `defaultPosition` → `withReader(parent, () => layoutValue(parent, d).childPosition(...))`
3. `sizeFromChildren`（浮层面板用的那一条）→ `withReader(node, …)`

第 3 条曾被漏掉（`smoke-overlay` 的「面板自己的子项成环要查出来」是它的回归用例）。
注意掩盖效应：子节点若走**默认 `position`**，第 2 条会顺带把父级布局算一遍、把
READ 边补上，于是第 3 条漏了也看不出来；只有子节点**自己算位置**时才暴露。

ooc / Rust 侧建议**直接采用 Kotlin 的结构式做法**（布局对象持有 owner），
比动态栈少一类维护负担。
