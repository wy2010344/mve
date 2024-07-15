import { StoreValueCreater, RenderMapStoreValueCreater, renderMapF } from "mve-core";
import { alawaysTrue } from "wy-helper";


function hasValueBase<C>(hasValue: (i: C) => any, i: C) {
  return hasValue(i)
}
export function renderHasValue<C>(
  storeValueCreater: RenderMapStoreValueCreater,
  initValue: C,
  hasValue: (i: C) => boolean,
  getNextValue: (v: C) => C,
  getKey: (i: C) => any,
  getConfig: (i: C) => StoreValueCreater,
  render: (i: C) => void
) {
  return renderMapF(hasValue, initValue, hasValueBase, storeValueCreater, alawaysTrue, function (_, i) {
    return [getNextValue(i), getKey(i), getConfig(i), alawaysTrue, function () {
      return render(i)
    }, undefined]
  }, undefined)
}

export function renderMax(
  storeValueCreater: RenderMapStoreValueCreater,
  max: number,
  getKey: (i: number) => any,
  getConfig: (i: number) => StoreValueCreater,
  render: (i: number) => void
) {
  renderHasValue<number>(storeValueCreater, 0, (i) => i < max, step, getKey, getConfig, render)
}
function step(i: number) {
  return i + 1
}

