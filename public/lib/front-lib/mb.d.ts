declare var define:(paths:string[],success:(...args:any[])=>any)=>any;
declare var pathOf: (path: string) => string;
declare function require(moduleNames: string[], onLoad: (...args: any[]) => void): void;
interface JSDOMElement {
	type: string;
	id?:string|((v)=>void);
	cls?:string;
	text?: string;
	value?: string;
	html?:string;
	attr?: { [key: string]: string };
	style?: { [key: string]: string };
	action?: { [key: string]: ((e: Event) => void) };
	children?: (JSDOMElement | string | {jsdom:any;id?:string})[]
}
declare namespace jsdom{
	function parseElement(e:JSDOMElement,me?:{[propName: string]: any;}):HTMLElement;
}
declare namespace mb {
	const isIE:boolean;
	function log(message?: any, ...optionParams: any[]):void;
	
	namespace Function{
		interface Quote{
			one(a:any):any
			one():void;
		}
		const quote:Quote
		const or_run:(fun?:()=>void)=>void
	}

	namespace util{
		function urlFromDic(dic:{[key:string]:string},prefix?:string):string;
		function calAbsolutePath(base_url:string,url:string):string;
	}
	namespace task {
		interface TaskQueueParam {
			array: any[]|null;
			trans: (o:{
				row:any,
				index:number,
				notice:(v?:any)=>void
			}) => void|null;
			success: (o) => void|null;
		}
		function queue(p: TaskQueueParam): void;

		interface TaskAllParam {
			data: object|null,
			trans?: (o:{
				value:any,
				key:string,
				notice:(v?:any)=>void
			}) => void|null;
			success: (o) => void|null;
		}
		function all(p: TaskAllParam): void;
	}

	namespace ajax {
		function get(p:{
			url:string,
			data?:object,
			dataType?:string,
			operate?:(xhr:any)=>void;
			success:(o:any)=>void
		}): void;
		function post(p:{
			url:string,
			data?:object,
			dataType?:string,
			operate?:(xhr:any)=>void;
			success:(o:any)=>void;
			error?:(e)=>void;
		}): void;
		interface Require{
			(url:string,fun:(object:any)=>void):void;
			baseUrl:string;
			getTxt:(path:string,success:(v:string)=>void)=>void;
			async:<T>(fun:(notice:(t:T)=>void)=>void)=>T
		}
		namespace util{
			function cros(xhr:any):void;
		}
		const require:Require;
	}

	namespace Array{
		function forEach<T>(vs:T[],fun:(row:T,index:number)=>void):void;
		function map<T,V>(vs:T[],fun:(row:T,index:number)=>V):V[];
		function flatMap<T,V>(vs:T[],fun:(row:T,index:number)=>V[]):V[]
		function find_row<T>(vs:T[],fun:(v:T,index:number)=>boolean):T;
		function find_index<T>(vs:T[],fun:(v:T,index:number)=>boolean):number;
		function reduce<T,V>(vs:T[],fun:(v:V,t:T,i:number)=>V,init:V):V;
		function filter<T>(vs:T[],fun:(t:T,i:number)=>boolean):T[];
		function indexOf<T>(vs:T[],x:any):number;
		function isArray(o:any):o is any[];
	}

	namespace Object{
		function forEach<T>(vs:{[key:string]:T},fun:(v:T,k:string)=>void):void;
		function map<T,V>(vs:{[key:string]:T},fun:(v:T,k:string)=>V):{[key:string]:V};
		function toArray<T,V>(vs:{[key:string]:T},fun:(v:T,k:string)=>V):V[];
		/**
		 * 用other去覆盖m
		 * @param m 
		 * @param other 
		 */
		function ember<T>(m:{[key:string]:T},other:{[key:string]:T}):{[key:string]:T};
		/**
		 * 如果m中没有，则用other中的值去覆盖
		 * @param m 
		 * @param other 
		 */
		function orDefault<T>(m:{[key:string]:T},other:{[key:string]:T}):{[key:string]:T};
		/**
		 * 二者结合生成一个新的
		 * @param m 
		 * @param other 
		 */
		function combine<T>(m:{[key:string]:T},other:{[key:string]:T}):{[key:string]:T};
	}
	namespace DOM {
		function cls(el:Node):{add(cls:string):void,remove(cls:string):void};
		function addEvent(e: Node, name: string, fun: (e?: Event) => void): void;
		function removeEvent(e: Node, name: string, fun:(e?: Event) => void): void;
		function isMobile():boolean;
		function stopPropagation(e:Event);
		function preventDefault(e:Event);
		function scrollWidth():number;
		function empty(e:Node):void;
		function divTabAllow(e:MouseEvent):void;
		function inputTabAllow(e:MouseEvent,tabReplace?:string):void;
		function copyElement(div:Node):void;
	}

	namespace browser{
		const type:string;
	}
}

declare interface Date{
	format:(v:string)=>string;
}