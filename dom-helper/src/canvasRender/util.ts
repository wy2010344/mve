export function inRange(before: number, n: number, size: number): boolean {
  return before < n && n < before + size;
}
