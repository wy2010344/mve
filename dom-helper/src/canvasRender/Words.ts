import {
  nextBoundary as nextCluster,
  prevBoundary as prevCluster,
} from './Graphemes';

function isWordChar(c: string): boolean {
  if (c.length !== 1) return false;
  const code = c.charCodeAt(0);
  if (code >= 0xd800 && code <= 0xdbff) return false;
  return /[\p{L}\p{N}]/u.test(c);
}

function isWhitespace(c: string): boolean {
  return /\s/u.test(c);
}

/** [pos] 前一个词边界。 */
export function prevBoundary(text: string, pos: number): number {
  let i = Math.min(Math.max(pos, 0), text.length);
  while (i > 0) {
    const p = prevCluster(text, i);
    if (!isWhitespace(text[p])) break;
    i = p;
  }
  if (i <= 0) return 0;
  const p = prevCluster(text, i);
  return isWordChar(text[p])
    ? (() => {
        let j = i;
        while (j > 0) {
          const q = prevCluster(text, j);
          if (!isWordChar(text[q])) break;
          j = q;
        }
        return j;
      })()
    : p;
}

/** [pos] 后一个词边界。 */
export function nextBoundary(text: string, pos: number): number {
  const n = text.length;
  let i = Math.min(Math.max(pos, 0), n);
  while (i < n) {
    if (!isWhitespace(text[i])) break;
    i = nextCluster(text, i);
  }
  if (i >= n) return n;
  return isWordChar(text[i])
    ? (() => {
        let j = i;
        while (j < n && isWordChar(text[j])) {
          j = nextCluster(text, j);
        }
        return j;
      })()
    : nextCluster(text, i);
}

/**
 * 包含 [offset] 的整词区间（半开区间），供双击选词使用。
 * 语义与导航（[prevBoundary]/[nextBoundary]）一致：
 * offset 落在词字符上 → 扩展为连续词字符区间；落在标点/emoji/空白 → 该簇自身即一词。
 */
export function wordRangeAt(text: string, offset: number): [number, number] | null {
  const n = text.length;
  if (n == 0) return null;
  const pos = Math.min(Math.max(offset, 0), n - 1);
  const anchor = prevCluster(text, pos + 1);
  if (!isWordChar(text[anchor])) {
    return [anchor, nextCluster(text, anchor)];
  }
  let start = anchor;
  while (start > 0) {
    const p = prevCluster(text, start);
    if (p == start || !isWordChar(text[p])) break;
    start = p;
  }
  let end = nextCluster(text, anchor);
  while (end < n) {
    const q = nextCluster(text, end);
    if (q == end || !isWordChar(text[end])) break;
    end = q;
  }
  return [start, end];
}