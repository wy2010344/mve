
type EmptyFun=()=>void;
/**
 * 单元素的解析返回
 */
export type EOParseResult<EO>={
	element:EO,
	init:EmptyFun,
	destroy:EmptyFun
}


export interface BuildResult{
  init():void,
  destroy():void
}