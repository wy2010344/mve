import type { PointKey } from 'wy-helper';
import type { Node2, Node2Parent } from './protocol';
import { layoutDep, takeProbeEdges } from './geometry';
import type { LayoutProbeEdge2 } from './geometry';

/**
 * 布局依赖审计（runtime audit）——对标 Kotlin `LayoutAudit.kt`。
 *
 * ## 为什么不是"静态 linter"
 *
 * 节点是 `children()` 里的**闭包**，运行时由信号驱动创建：
 * ```ts
 * rectNode({ children: [todoItem(...)] })   // 编译期不存在这棵树
 * ```
 * 编译期没有树，AST 分析无从下手——只能在**已构建的树**上做检查。
 *
 * 与"撞一个修一个"的本质区别：
 *
 * | | 崩溃驱动 | 运行时审计 |
 * |---|---|---|
 * | 发现时机 | 渲染到那一条路径才炸 | 一次跑出**全部**违规点 |
 * | 覆盖 | 取决于这次渲染走到哪 | 整棵树（可遍历） |
 * | 成本 | 每次一个编译 + 渲染周期 | 一次遍历 |
 *
 * ## 怎么在不崩溃的前提下拿到依赖图
 *
 * 成环形态是 `父级布局 → 子的尺寸 → 子.sizeFromParent → 父级布局`。
 * 若真让它跑，环闭合处立刻抛 [LayoutCycleError]，只能拿到**第一个**环。
 *
 * `layoutDep.probeMode` 把这一步改成「记依赖边、不再递归」：
 * `sizeFromParent` 返回占位尺寸而不回头问父级，于是整棵树可以安全测量一遍，
 * 拿到完整依赖图；判环退化为**图上的边配对**——纯算法，不依赖运行时异常。
 *
 * ## 用法
 *
 * ```ts
 * for (const text of auditLayoutReport(root)) console.warn(text);
 * ```
 *
 * 审计只读：探测模式结束后自动恢复，不改变任何布局结果。
 */

/** 一条违规：某个节点的尺寸依赖父级，而父级反过来又读它的尺寸 */
export interface LayoutFinding2 {
  /** 成环涉及的节点（子节点侧） */
  readonly node: Node2;
  /** 成环涉及的父级 */
  readonly parent: Node2Parent;
  /** 节点索要尺寸的方向 */
  readonly direction: PointKey;
  /** 环上的依赖边（按求值顺序：先"子索要父"，再"父读子"闭合） */
  readonly cycle: readonly LayoutProbeEdge2[];
  /** 人类可读的报告（定位到业务名、方向、根因与修法） */
  report(): string;
}

/** 审计过程的上下文：节点编号（报告与边键都靠它，不散成模块级可变状态） */
interface AuditScope {
  /** 节点显示名 + 序号（父级也在遍历里，按父类型取即可） */
  describe(node: Node2Parent): string;
  /** 三元组标识（同一 (父, 子, 方向) 才可能是同一个环） */
  key(edge: LayoutProbeEdge2): string;
}

/**
 * 审计一棵已构建的树，返回全部成环点（不抛异常）。
 *
 * @param root 树根（通常是 renderCanvas 返回的 node）
 * @param maxFindings 最多返回多少条（避免超大树的报告刷屏；默认不限）
 */
export function auditLayout(
  root: Node2,
  maxFindings = Number.MAX_SAFE_INTEGER
): LayoutFinding2[] {
  // 1) 遍历树，收集节点与它们的序号（报告里要靠序号定位）
  const scope = collectScope(root);

  // 2) 探测模式测量整棵树，收集 ASK / READ 两条边
  const prev = layoutDep.probeMode;
  layoutDep.probeMode = true;
  let edges: { asks: LayoutProbeEdge2[]; reads: LayoutProbeEdge2[] };
  try {
    for (const node of scope.nodes) {
      // 四个都碰，缺一不可：
      // - width / height：触发 **ASK** 边（子向父索要尺寸）；
      // - x / y：触发父级的 childPosition → 父级布局求值 → 遍历子项取尺寸
      //   → **READ** 边。只测尺寸不够：`justify=between` 这类容器的布局
      //   只在算位置时才被求值。
      tryRun(() => node.width());
      tryRun(() => node.height());
      tryRun(() => node.x());
      tryRun(() => node.y());
    }
    edges = takeProbeEdges();
  } finally {
    layoutDep.probeMode = prev;
    layoutDep.readers.length = 0;
  }

  // 3) 配对找环（见 findCycles 的说明）
  return findCycles(edges.asks, edges.reads, maxFindings, scope);
}

/** 一次性拿到全部报告文本（直接 console.warn / 打到日志里） */
export function auditLayoutReport(
  root: Node2,
  maxFindings = Number.MAX_SAFE_INTEGER
): string[] {
  return auditLayout(root, maxFindings).map(it => it.report());
}

/** 遍历树登记序号（只取结构，不测尺寸） */
function collectScope(root: Node2): AuditScope & { nodes: readonly Node2[] } {
  const nodes: Node2[] = [];
  // 遍历时顺手把名字存下来：报告里要用，而父级只有最小父类型（拿不到 debugName）
  const infoMap = new Map<Node2Parent, { index: number; name: string }>();
  (function walk(node: Node2) {
    infoMap.set(node, { index: nodes.length, name: node.debugName() ?? '节点' });
    nodes.push(node);
    for (const child of node.children()) {
      walk(child);
    }
  })(root);
  const indexOf = (node: Node2Parent) => infoMap.get(node)?.index ?? -1;
  const describe = (node: Node2Parent) => {
    const info = infoMap.get(node);
    if (!info) return '节点#?';
    return `${info.name}#${info.index}`;
  };
  return {
    nodes,
    describe,
    key(edge) {
      return `${edge.d}@${indexOf(edge.parent)}>${indexOf(edge.child)}`;
    },
  };
}

/** 单次测量失败不应中断整棵树的审计（对齐 Kotlin 的 runCatching） */
function tryRun(run: () => number): void {
  try {
    run();
  } catch {
    // 单个节点测不动（notInLayout / 无父级 / 用户自己抛错）：跳过，继续遍历
  }
}

/**
 * 在依赖图上找环 —— **纯观测判据，不复述引擎规则**。
 *
 * 两个集合：
 * - **ASK**：子向父索要尺寸（[sizeFromParent] 处记录）
 * - **READ**：父级测量时读取子项尺寸（`size()` 处记录）
 *
 * 同一个 `(父级, 子节点, 方向)` 三元组同时出现在两个集合中 ⟹ 互依 ⟹ 成环。
 *
 * ## 为什么这样判
 *
 * 早期版本在 auditor 里**复述**引擎规则（"父级是 Flex 就必然回读子项"），
 * 结果 363 处误报：漏了 grow 子项那一支、也漏了交叉轴的 alignFix / alignItem
 * 语义。规则一复述就会与引擎漂移。
 *
 * 改成观测后，判据与引擎行为**天然一致**——分支怎么走是引擎自己决定的，
 * auditor 只负责把两个事实配对。引擎将来改了分支语义，审计自动跟上。
 */
function findCycles(
  asks: readonly LayoutProbeEdge2[],
  reads: readonly LayoutProbeEdge2[],
  maxFindings: number,
  scope: AuditScope
): LayoutFinding2[] {
  if (asks.length == 0 || reads.length == 0) return [];

  // READ 边按 (父级, 子节点, 方向) 建索引
  const readKeys = new Set<string>();
  for (const r of reads) {
    readKeys.add(scope.key(r));
  }

  const findings: LayoutFinding2[] = [];
  const reported = new Set<string>();
  for (const ask of asks) {
    // 同一三元组既被"索要"又被"读取" → 互依
    const key = scope.key(ask);
    if (!readKeys.has(key)) continue;
    // 同一三元组只报一次（探测会把每条边记到多次）
    if (reported.has(key)) continue;
    reported.add(key);

    findings.push({
      node: ask.child,
      parent: ask.parent,
      direction: ask.d,
      // 环是两条边闭合的：子 → 父（索要），父 → 子（被测量）
      cycle: [ask, { parent: ask.parent, child: ask.child, d: ask.d }],
      report() {
        return reportFinding(this, scope);
      },
    });
    if (findings.length >= maxFindings) break;
  }
  return findings;
}

function reportFinding(finding: LayoutFinding2, scope: AuditScope): string {
  const d = finding.direction;
  const name = scope.describe(finding.node);
  const parentName = scope.describe(finding.parent);
  const dir = d === 'x' ? '宽度' : '高度';
  return [
    `布局依赖成环：${name} 的${dir}依赖父级 ${parentName}，而父级测量时又回读了它。`,
    `  依赖链：${name} → ${parentName}（索要尺寸）→ ${name}（被父级测量）  ← 环在此闭合`,
    '  含义：该节点未提供确定尺寸，沿默认尺寸回落到"向父级索要"，而其父级正在测量时又读回了它。',
    '  修法（二选一）：',
    '    1) 让该节点有确定尺寸（不依赖父级）：返回 { value: 测得值, fromInside: false }；',
    '    2) 让它成为 grow 子节点（grow({ argGrow: 1 })），由父级分配尺寸，父级便不会回读它。',
  ].join('\n');
}
