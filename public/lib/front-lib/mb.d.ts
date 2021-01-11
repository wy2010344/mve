declare var define:(paths:string[],success:(...args:any[])=>any)=>any;
declare var pathOf: (path?: string) => string;
declare function require(moduleNames: string[], onLoad: (...args: any[]) => void): void;
declare namespace mb {
	const isIE:boolean;
	function log(message?: any, ...optionParams: any[]):void;
	
	namespace util{
		function urlFromDic(dic:{[key:string]:string|number|boolean},prefix?:string):string;
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
			success(o):void|null;
		}
		function queue(p: TaskQueueParam): void;

		interface TaskAllParam {
			data: object|null,
			trans?: (o:{
				value:any,
				key:string,
				notice:(v?:any)=>void
			}) => void|null;
			success(o):void|null;
		}
		function all(p: TaskAllParam): void;
	}

	namespace ajax {
		function get(p:{
			url:string,
			data?:object,
			dataType?:string,
			operate?(xhr:XMLHttpRequest):void;
			success(o:any):void
		}): void;
		function post(p:{
			url:string,
			data?:any,
			dataType?:string,
			operate?(xhr:XMLHttpRequest):void;
			success(o:any):void
			error?(e):void;
		}): void;
		interface Require{
			(url:string,fun:(object:any)=>void):void;
			baseUrl:string;
			getTxt(path:string,success:(v:string)=>void):void;
			async<T>(fun:(notice:(t:T)=>void)=>void):T
			clear(path:string):void
		}
		namespace util{
			function cros(xhr:XMLHttpRequest):void;
		}
		const require:Require;
	}
	namespace DOM {
		function cls(el:Node):{add(cls:string):void,remove(cls:string):void};
		function addEvent(e: Node, name: string, fun: (e?: Event) => void,option?:{capture:boolean}|boolean): void;
		function removeEvent(e: Node, name: string, fun:(e?: Event) => void,option?:{capture:boolean}|boolean): void;
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