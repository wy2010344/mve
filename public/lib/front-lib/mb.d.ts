declare var define:(paths:string[],success:(...args:any[])=>any)=>any;
declare var pathOf: (path?: string) => string;
declare function require(moduleNames: string[], onLoad: (...args: any[]) => void): void;
declare namespace mb {
	const isIE:boolean;
	function log(message?: any, ...optionParams: any[]):void;

	namespace util{
		function decodeURI(str:string):string
		function dicFromUrl(search:string):{[key:string]:string}
		function urlFromDic(dic:{[key:string]:string|number|boolean},prefix?:string):string;
		function calAbsolutePath(base_url:string,url:string):string;
	}
	namespace ajax {
		type DataType="text"|"json"|"formdata"
		function get(p:{
			url:string,
			data?:object,
			dataType?:DataType,
			operate?(xhr:XMLHttpRequest):void;
			success(o:XMLHttpRequest):void
		}): void;
		function post(p:{
			url:string,
			data?:any,
			dataType?:DataType,
			operate?(xhr:XMLHttpRequest):void;
			success(o:XMLHttpRequest):void
		}):void;
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
		function stopPropagation(e:Event):void;
		function preventDefault(e:Event):void;
		function scrollWidth():number;
		function empty(e:Node):void;
		function divTabAllow(e:MouseEvent):void;
		function inputTabAllow(e:MouseEvent,tabReplace?:string):void;
		function copyElement(div:Node):void;
	}

	namespace browser{
		const type:"IE"|"FF"|"Opera"|"Safari";
	}
}