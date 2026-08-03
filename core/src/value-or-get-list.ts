export type ValueOrGetList<T> = T | (() => ValueOrGetList<T>[]);

export function purifyList<T>(
  children: readonly ValueOrGetList<T>[],
  list: T[],
  ignore: (n: T) => boolean
): void {
  for (const child of children) {
    if (typeof child == 'function') {
      purifyList((child as () => ValueOrGetList<T>[])(), list, ignore);
    } else {
      if (ignore(child)) {
        return;
      }
      list.push(child);
    }
  }
}

export function purifySet<T>(
  children: readonly ValueOrGetList<T>[],
  list: Set<T>,
  ignore: (n: T) => boolean
): void {
  for (const child of children) {
    if (typeof child == 'function') {
      purifySet((child as () => ValueOrGetList<T>[])(), list, ignore);
    } else {
      if (ignore(child)) {
        return;
      }
      list.add(child);
    }
  }
}
