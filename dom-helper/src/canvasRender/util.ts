export function inRange(before: number, n: number, size: number): boolean {
  return before < n && n < before + size;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function insert(str: string, index: number, text: string): string {
  return str.substring(0, index) + text + str.substring(index);
}

export function removeRange(
  str: string,
  start: number,
  end: number
): string {
  return str.substring(0, start) + str.substring(end);
}
