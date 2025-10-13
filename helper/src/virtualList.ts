import { getSubListForVirtualList, GetValue, memo, ReadArray } from 'wy-helper';
import { memoArray } from './renderMap';

export function getSubListInfo(
  fun: GetValue<ReturnType<typeof getSubListForVirtualList>>
) {
  const subListInfo = memo(fun);
  const subList = memoArray(() => {
    const i = subListInfo();
    return [i.beginIndex, i.endIndex] as const;
  });
  return {
    paddingBegin() {
      return subListInfo().paddingBegin;
    },
    subList,
  };
}
