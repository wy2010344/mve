/** 注册 TS 解析钩子（配合 --experimental-strip-types 直跑 demo 的 .ts 模块） */
import { register } from 'node:module';

register('./smoke-ts-resolve.mjs', import.meta.url);
