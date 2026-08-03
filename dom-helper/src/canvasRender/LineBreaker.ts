/**
 * UAX #14 断行机会检测。
 *
 * 返回 text 中所有合法的行断开位置（UTF-16 索引，不含 0、包含 text.length）。
 * 优先使用 Intl.Segmenter，不支持时退化为逐码点断行。
 */
export function lineBreakOpportunities(
  text: string,
  locale?: string
): number[] {
  if (text.length == 0) return [];
  const result: number[] = [];
  if (typeof Intl.Segmenter == 'function') {
    const segmenter = new Intl.Segmenter(locale, { granularity: 'line' as any });
    for (const seg of segmenter.segment(text) as Iterable<{ index: number; isBreakable: boolean }>) {
      if (seg.index > 0 && seg.isBreakable) {
        result.push(seg.index);
      }
    }
  } else {
    for (let i = 1; i <= text.length; i++) {
      result.push(i);
    }
  }
  return result;
}
