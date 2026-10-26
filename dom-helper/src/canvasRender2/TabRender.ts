/**
 * 显示层 tab 展开工具（对标 Kotlin TabRender）：
 * 集中在段落构建与索引映射入口，各节点复用。
 *
 * 段落（CanvasKit）对 '\t' 的宽度是未定义的，因此显示文本统一展开为空格；
 * 逻辑索引（模型文本，含 '\t'）与显示索引（展开后文本）的换算在编辑器
 * 光标/选区映射时使用（见 EditableTextNode 的 displayToLogicIndex 重写）。
 */

/** 单个 tab 展开的等效空格数（固定 4，对标 Kotlin SPACES_PER_TAB）。 */
export const SPACES_PER_TAB = 4;

/** 显示层 tab 展开：逐字符替换。 */
export function expandTabs(text: string): string {
  return text.replace(/\t/g, ' '.repeat(SPACES_PER_TAB));
}

/**
 * 逻辑索引 → 显示索引：每个 '\t' 贡献 [SPACES_PER_TAB] 个显示位，其余 1 个。
 * 越界时钳制到 [0, text.length]。
 */
export function logicToDisplay(text: string, logicPos: number): number {
  const limit = Math.min(Math.max(logicPos, 0), text.length);
  let display = 0;
  for (let i = 0; i < limit; i++) {
    display += text.charAt(i) === '\t' ? SPACES_PER_TAB : 1;
  }
  return display;
}

/**
 * 显示索引 → 逻辑索引：反向扫描；落在展开区间中间时吸附到 tab 之后。
 * 越界（>= 显示总长）时返回 text.length。
 */
export function displayToLogic(text: string, displayPos: number): number {
  const len = text.length;
  let logic = 0;
  let disp = 0;
  while (logic < len && disp < displayPos) {
    disp += text.charAt(logic) === '\t' ? SPACES_PER_TAB : 1;
    logic++;
  }
  return logic;
}
