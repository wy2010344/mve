// ---------------------------------------------------------------------------
// EachValue — 继承 StateHolderI，实现 EachTime
// ---------------------------------------------------------------------------

export interface EachTime<T> {
  getIndex(): number;
  getValue(): T;
}
