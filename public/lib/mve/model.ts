
export type EmptyFun=()=>void;

export interface BuildResult{
	init():void,
	destroy():void
}
/**
 * 单元素的解析返回
 */
export interface EOParseResult<EO> extends BuildResult{
	element:EO
}