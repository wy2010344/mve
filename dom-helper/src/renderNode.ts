
import { EmptyFun, run, ValueOrGet } from 'wy-helper';
import { renderTextContent, renderHtmlContent } from 'mve-dom';
import { GetChild } from 'wy-dom-helper';

export type TNode = EmptyFun | GetChild | number | string;
export function renderTNode(
  children: TNode | undefined,
  whenText?: (children: ValueOrGet<string | number>) => void,
  whenDefault: (children: EmptyFun) => void = run,
  whenHtml?: (children: ValueOrGet<string | number>) => void,
) {
  whenHtml = whenText || renderHtmlContent;
  whenText = whenText || renderTextContent;
  const tp = typeof children;
  if (tp == 'function') {
    if ((children as any).type == 'text') {
      whenText(children as any);
    } else if ((children as any).type == 'html') {
      whenHtml(children as any);
    } else {
      whenDefault(children as any);
    }
  } else if (tp == 'string' || tp == 'number') {
    whenText(children as any);
  } else {
    return false;
  }
  return true;
}
