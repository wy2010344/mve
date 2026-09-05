import { StateHolderWithNode } from 'mve-core';
export function fc<
  F extends (this: StateHolderWithNode<N, Target>, ...vs: any) => any,
  N = Node,
  Target = readonly Node[],
>(f: F) {
  return function (...vs: Parameters<F>) {
    return function (this: StateHolderWithNode<N, Target>, node: N) {
      f.apply(this, vs);
    };
  };
}

// const m = fc(function (a: string, b: number) {});
