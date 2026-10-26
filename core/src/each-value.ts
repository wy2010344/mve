// ---------------------------------------------------------------------------
// EachValue — 继承 StateHolderI，实现 EachTime
// ---------------------------------------------------------------------------

export interface EachTime<T, K> {
  getIndex(): number;
  getValue(): T;
  key: K;
}
