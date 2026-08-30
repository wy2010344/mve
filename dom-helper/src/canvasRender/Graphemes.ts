const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function boundariesOf(text: string): number[] {
  if (text.length === 0) return [0];
  const arr: number[] = [0];
  let last = 0;
  for (const seg of segmenter.segment(text)) {
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
  for (const _ of segmenter.segment(text)) count++;
  return count;
}