/**
 * 字素簇（grapheme cluster）边界与简单词边界。
 *
 * 纯字符串函数、零节点依赖 —— canvasRender / canvasRender2 与未来的树形态
 * 共用这一份实现（原先两套各有一份，语义等价但性能与 API 形态不同）。
 *
 * 对标 Kotlin `Graphemes` / `Words`：光标移动与删除必须以簇为单位，
 * 否则 emoji 会被拆半、退格删出乱码（对标 Web Intl.Segmenter / Flutter characters）。
 *
 * 平台实现：Node >= 16 与主流浏览器均内置 `Intl.Segmenter(granularity:'grapheme')`，
 * 其分段结果与 Kotlin 的 `BreakIterator.getCharacterInstance()` 语义一致。
 */

/** 分段器惰性单例：避免模块加载即依赖 Intl.Segmenter（SSR / 老运行时安全） */
let cachedSegmenter: Intl.Segmenter | null = null;

function segmenter(): Intl.Segmenter {
  if (!cachedSegmenter) {
    cachedSegmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });
  }
  return cachedSegmenter;
}

/** 计算 [text] 的全部字素簇边界（含 0 与 text.length），升序、无重复 */
function boundariesOf(text: string): number[] {
  if (text.length === 0) return [0];
  const arr: number[] = [0];
  let last = 0;
  for (const seg of segmenter().segment(text)) {
    const s = seg.index;
    if (s !== last) {
      arr.push(s);
      last = s;
    }
  }
  if (last !== text.length) arr.push(text.length);
  return arr;
}

/**
 * [index] 所在位置的下一簇边界（即当前簇的结束偏移）。
 * [index] 已在边界上时返回下一簇的结束；越界钳制到 [0, length]。
 */
export function nextBoundary(text: string, index: number): number {
  const n = text.length;
  if (index < 0) return 0;
  if (index >= n) return n;
  const b = boundariesOf(text);
  let lo = 0;
  let hi = b.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (b[mid] <= index) lo = mid + 1;
    else hi = mid;
  }
  return b[lo];
}

/** [index] 前一个簇边界；[index] <= 0 时返回 0。约定调用方传入合法索引。 */
export function prevBoundary(text: string, index: number): number {
  if (index <= 0) return 0;
  const n = text.length;
  if (index > n) index = n;
  const b = boundariesOf(text);
  let lo = 0;
  let hi = b.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (b[mid] < index) {
      ans = b[mid];
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

/** [text] 的字素簇数量。 */
export function clusterCount(text: string): number {
  if (text.length === 0) return 0;
  let count = 0;
  for (const _ of segmenter().segment(text)) count++;
  return count;
}

/**
 * 字素簇边界的命名空间形态（供 canvasRender2 的 `Graphemes.xxx` 调用风格使用）。
 * 与上面的具名函数是同一份实现，仅换调用形态。
 */
export const Graphemes = {
  nextBoundary,
  prevBoundary,
  clusterCount,
};

/** 该字符是否构成“词”的一部分（Unicode 字母/数字；代理对首码元单独判定为否） */
export function isWordChar(c: string): boolean {
  if (c.length !== 1) return false;
  const code = c.charCodeAt(0);
  if (code >= 0xd800 && code <= 0xdbff) return false;
  return /[\p{L}\p{N}]/u.test(c);
}

function isWhitespace(c: string): boolean {
  return /\s/u.test(c);
}

/**
 * [pos] 前一个词边界。
 * 规则（对标主流编辑器的简化语义，与 Kotlin `Words` 一致）：
 * - 连续的字母/数字为一个词（汉字按 Unicode 类别同样视为词字符，整段连跳）；
 * - 光标紧邻空白时先跳过空白；
 * - 其余字符（标点、符号、emoji）每簇一步。
 */
export function wordPrevBoundary(text: string, pos: number): number {
  let i = Math.min(Math.max(pos, 0), text.length);
  while (i > 0) {
    const p = prevBoundary(text, i);
    if (!isWhitespace(text[p])) break;
    i = p;
  }
  if (i <= 0) return 0;
  const p = prevBoundary(text, i);
  if (!isWordChar(text[p])) return p;
  let j = i;
  while (j > 0) {
    const q = prevBoundary(text, j);
    if (!isWordChar(text[q])) break;
    j = q;
  }
  return j;
}

/** [pos] 后一个词边界；规则同 [wordPrevBoundary]。 */
export function wordNextBoundary(text: string, pos: number): number {
  const n = text.length;
  let i = Math.min(Math.max(pos, 0), n);
  while (i < n) {
    if (!isWhitespace(text[i])) break;
    i = nextBoundary(text, i);
  }
  if (i >= n) return n;
  if (!isWordChar(text[i])) return nextBoundary(text, i);
  let j = i;
  while (j < n && isWordChar(text[j])) {
    j = nextBoundary(text, j);
  }
  return j;
}

/**
 * 包含 [offset] 的整词区间（半开区间），供双击选词使用。
 * 语义与导航（[wordPrevBoundary] / [wordNextBoundary]）一致：
 * offset 落在词字符上 → 扩展为连续词字符区间；落在标点/emoji/空白 → 该簇自身即一词。
 */
export function wordRangeAt(
  text: string,
  offset: number
): [number, number] | null {
  const n = text.length;
  if (n == 0) return null;
  const pos = Math.min(Math.max(offset, 0), n - 1);
  const anchor = prevBoundary(text, pos + 1);
  if (!isWordChar(text[anchor])) {
    return [anchor, nextBoundary(text, anchor)];
  }
  let start = anchor;
  while (start > 0) {
    const p = prevBoundary(text, start);
    if (p == start || !isWordChar(text[p])) break;
    start = p;
  }
  let end = nextBoundary(text, anchor);
  while (end < n) {
    const q = nextBoundary(text, end);
    if (q == end || !isWordChar(text[end])) break;
    end = q;
  }
  return [start, end];
}

/** 词边界的命名空间形态（同上，供 `Words.xxx` 调用风格使用） */
export const Words = {
  isWordChar,
  prevBoundary: wordPrevBoundary,
  nextBoundary: wordNextBoundary,
  wordRangeAt,
};
