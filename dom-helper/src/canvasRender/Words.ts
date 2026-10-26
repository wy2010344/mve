/**
 * 词边界 —— 实现已抽到 `canvasCore/Graphemes`，两套树共用一份。
 * 此处仅做转发（core 里词边界函数带 `word` 前缀以区分字素簇函数），
 * 保持本目录的既有导出名不变。
 */
export {
  wordPrevBoundary as prevBoundary,
  wordNextBoundary as nextBoundary,
  wordRangeAt,
  isWordChar,
} from '../canvasCore/Graphemes';
