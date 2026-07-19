export type ValueOrGetList<T> = T | (() => ValueOrGetList<T>[]);

export function purifyList<T>(children: ValueOrGetList<T>[], list: T[]): void {
  for (const child of children) {
    if (typeof child == 'function') {
      purifyList((child as () => ValueOrGetList<T>[])(), list);
    } else {
      list.push(child);
    }
  }
}
