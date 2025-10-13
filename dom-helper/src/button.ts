import { createSignal, GetValue } from 'wy-helper';

export function toButtonClick<T>({
  onClick,
  loading,
}: {
  loading?: GetValue<any>;
  onClick(v: T): any;
}) {
  const innerLoading = createSignal(false);
  const isLoading = loading
    ? function () {
        return loading!() || innerLoading.get();
      }
    : innerLoading.get;
  return {
    loading: isLoading,
    onClick(v: T) {
      if (isLoading()) {
        return;
      }
      const out = onClick!(v) as any;
      if (out instanceof Promise) {
        innerLoading.set(true);
        out.finally(() => {
          innerLoading.set(false);
        });
      }
    },
  };
}
