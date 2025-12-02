/*
题目：实现令牌桶限流器
题目描述：
在高并发场景下，为了防止接口被短时间内过多请求压垮，可以使用令牌桶算法（Token Bucket Algorithm）来进行限流。
令牌桶算法的核心思想是：
桶中存放令牌，容量固定。
系统会按固定速率向桶中放入令牌（超过容量则丢弃多余的令牌）。
每个请求需要消耗一个令牌，只有当桶中有令牌时请求才能通过。
要求：
每秒按固定速率（rate）生成令牌（token），并加入桶中。
桶中令牌数不能超过最大容量（capacity）。
请求到达时，如果桶中至少有 1 个令牌，则允许通过并消耗一个令牌；否则拒绝该请求。
输入：
capacity：整数，令牌桶的最大容量，1 <= capacity <= 50
rate：整数，每秒生成的令牌数量，1 <= rate <= 50
requests：浮点数数组，每个元素是请求的时间戳（单位：秒，升序），长度不超过 1000
输出：
返回一个布尔数组，表示每个请求是否被允许通过。
示例：
输入：
capacity = 2; // 最大令牌数量
rate = 2; // 每秒生成 2 个令牌
requests = [0, 0, 0.3, 0.8, 1.4, 1.5, 1.6, 2];

输出：
[true, true, false, true, true, true, false, true]

*/

import { createContext } from 'mve-core';
import { fdom } from 'mve-dom';
import { createSignal } from 'wy-helper';

function demo(capacity: number, rate: number, requests: number[]) {
  let bulk = capacity;
  const per = 1 / rate;
  let lastReq = 0;
  return requests.map(req => {
    const diff = req - lastReq;
    if (diff < per) {
      //还未生成
      if (bulk == 0) {
        return false;
      }
      bulk--;
      return true;
    } else {
      const m = Math.floor(diff / per);
      bulk += m;
      bulk = Math.min(bulk, capacity);
      bulk -= 1;
      lastReq = lastReq + m * per;
      return true;
    }
  });
}
console.log(demo(2, 2, [0, 0, 0.3, 0.8, 1.4, 1.5, 1.6, 2]));
