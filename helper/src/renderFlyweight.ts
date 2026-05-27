import { renderForEach, type EachTime } from 'mve-core';
import {
  BaseRMap,
  emptyObject,
  run,
  type GetValue,
  type ReadArray,
  type RMap,
} from 'wy-helper';

export function renderFlyweight<T, O = void>(
  forEach: (callback: (value: T) => void) => void,
  creater: (eachTime: EachTime<T>) => O,
  arg: {
    bindIndex?: any;
    bindValue?: any;
  } = emptyObject
) {
  const getSignal = renderForEach<T, number, O>(
    function (callback) {
      let i = 0;
      forEach(function (value) {
        callback(i++, value);
      });
    },
    function (i, et) {
      return creater(et);
    },
    {
      ...arg,
      createMap: createArrayMap,
    }
  );
}

export function renderFlyweightToArray<T, O = void>(
  forEach: (callback: (value: T) => void) => void,
  creater: (eachTime: EachTime<T>) => O,
  arg: {
    bindIndex?: any;
    bindValue?: any;
  } = emptyObject
) {
  let gets: GetValue<O>[];
  const getSignal = renderForEach<T, number, O>(
    function (callback) {
      let i = 0;
      gets = [];
      forEach(function (value) {
        const get = callback(i++, value);
        gets.push(get);
      });
    },
    function (i, et) {
      return creater(et);
    },
    {
      ...arg,
      createMap: createArrayMap,
    }
  );
  return function () {
    getSignal();
    return gets.map(run);
  };
}

function createArrayMap<T>() {
  return new ArrayRMap<T>();
}
class ArrayRMap<T> implements BaseRMap<number, T> {
  constructor(private list: T[] = []) {}
  get(key: number): T | undefined {
    return this.list[key];
  }
  set(key: number, value: T): void {
    this.list[key] = value;
  }
  forEach(fun: (value: T, key: number) => void): void {
    this.list.forEach(fun);
  }
}

export function renderArrayFlyweight<T>(
  getList: GetValue<ReadArray<T>>,
  render: (et: EachTime<T>) => void
) {
  renderFlyweight(function (forEach) {
    const list = getList();
    for (let i = 0; i < list.length; i++) {
      forEach(list[i]);
    }
  }, render);
}
