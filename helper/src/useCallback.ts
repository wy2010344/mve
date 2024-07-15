import { useMemo } from "./useRef";
export function useCallback<T extends (...vs: any[]) => any>(effect: T, deps: readonly any[]) {
  return useMemo(() => effect, deps)
}