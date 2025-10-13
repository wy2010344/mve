import { hookAddResult, hookTrackAttr, render, renderForEach } from 'mve-core';
import {
  EmptyFun,
  genTemplateStringS1,
  genTemplateStringS2,
  ValueOrGet,
  VType,
  vTypeisGetValue,
} from 'wy-helper';
import { renderPortal } from './hookChildren';
import { renderArray, renderOne } from 'mve-helper';
export { dom } from './dom';
export { svg } from './svg';
export type { StyleProps } from './node';
export * from './renderNode';
export * from './attrInOne';
export * from './hookChildren';

export function createRoot(node: Node, create: EmptyFun) {
  return render(() => {
    renderPortal(node, create);
  });
}

export function renderTextContent(value: ValueOrGet<string | number>) {
  const node = document.createTextNode('');
  hookAddResult(node);
  if (typeof value == 'function') {
    hookTrackAttr(value, c => {
      node.textContent = `${c}`;
    });
  } else {
    node.textContent = `${value}`;
  }
  return node;
}

export function renderText(ts: TemplateStringsArray, ...vs: VType[]) {
  const node = document.createTextNode('');
  if (vs.some(vTypeisGetValue)) {
    hookTrackAttr(
      () => {
        return genTemplateStringS2(ts, vs);
      },
      c => {
        node.textContent = c;
      }
    );
  } else {
    node.textContent = genTemplateStringS1(ts, vs as any);
  }
  hookAddResult(node);
  return node;
}

export function renderHtmlContent(value: ValueOrGet<string | number>) {
  const container = document.createElement('div');
  if (typeof value == 'function') {
    renderArray(() => {
      container.innerHTML = `${value()}`;
      return Array.from(container.childNodes);
    }, hookAddResult);
  } else {
    container.innerHTML = `${value}`;
    container.childNodes.forEach(node => {
      hookAddResult(node);
    });
  }
}

export function renderHtml(ts: TemplateStringsArray, ...vs: VType[]) {
  const container = document.createElement('div');
  if (vs.some(vTypeisGetValue)) {
    renderArray(() => {
      container.innerHTML = genTemplateStringS2(ts, vs);
      return Array.from(container.childNodes);
    }, hookAddResult);
  } else {
    container.innerHTML = genTemplateStringS1(ts, vs as any);
    container.childNodes.forEach(node => {
      hookAddResult(node);
    });
  }
}
