import { fdom } from "mve-dom";
import { createSignal } from "wy-helper";

export default function () {
  const count = createSignal(0);
  fdom.button({
    onClick() {
      count.set(count.get() + 1);
    },
    childrenType: "text",
    children() {
      return `count - ${count.get()}`;
    },
  });
}