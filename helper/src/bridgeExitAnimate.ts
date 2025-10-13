import {
  addEffect,
  buildUseExitAnimate,
  createSignal,
  emptyArray,
  ExitAnimateArg,
  ExitAnimateMode,
  ExitAnimateWait,
  GetValue,
  memo,
  quote,
  ValueOrGet,
  valueOrGetToGet,
} from 'wy-helper';

export function getExitAnimate<V, K>(
  getList: GetValue<readonly V[]>,
  getKey: (v: V) => K,
  arg?: ExitAnimateArg<V> & {
    mode?: ValueOrGet<ExitAnimateMode | undefined>;
    wait?: ValueOrGet<ExitAnimateWait | undefined>;
  }
) {
  const wait = valueOrGetToGet(arg?.wait);
  const mode = valueOrGetToGet(arg?.mode);
  const cacheList = {
    list: emptyArray,
  };
  const version = createSignal(Number.MIN_SAFE_INTEGER);
  function updateVersion() {
    version.set(version.get() + 1);
  }
  return memo(() => {
    version.get();
    const { list, effect } = buildUseExitAnimate(
      updateVersion,
      cacheList,
      quote,
      getList(),
      getKey,
      {
        ...arg,
        mode: mode(),
        wait: wait(),
      }
    );
    addEffect(effect);
    return list;
  });
}
