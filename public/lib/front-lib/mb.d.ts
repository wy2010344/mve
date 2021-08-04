declare var define:(paths:string[],success:(...args:any[])=>any)=>any;
declare var pathOf: (path?: string) => string;
declare function require(moduleNames: string[], onLoad: (...args: any[]) => void): void;
declare namespace mb {
	const isIE:boolean;
	function log(message?: any, ...optionParams: any[]):void;

	namespace util{
		function delaySkipCall(time:number):(fun:()=>void)=>void
		function delaySkipCall<T>(time:number,fun:(...ts:T[])=>void):(...ts:T[])=>void
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
		namespace util{
			function cros(xhr:XMLHttpRequest):void;
		}
		function require(url:string,fun:(object:any)=>void):void;
		namespace require{
			const baseUrl:string;
			function getTxt(path:string,success:(v:string)=>void):void;
			function async<T>(fun:(notice:(t:T)=>void)=>void):T
			function clear(path:string):void
			function clearAll():void
			namespace cp{
				const version:string
				const baseUrl:string
				const alias:{[key:string]:string}
			}
		}
	}
	namespace DOM {
		namespace contentEditable{
			const text:string
		}
		function isNode(el):el is Node;
		function wheelDelta(e:WheelEvent):number
		function cls(el:Node):{add(cls:string):void,remove(cls:string):void};
		function addEvent(e: Node|Window, name: string, fun: (e?: Event) => void,option?:{capture:boolean}|boolean): void;
		function removeEvent(e: Node|Window, name: string, fun:(e?: Event) => void,option?:{capture:boolean}|boolean): void;
		function isMobile():boolean;
		function stopPropagation(e:Event):void;
		function preventDefault(e:Event):void;
		function scrollWidth():number;
		function empty(e:Node):void;
		function divTabAllow(e:MouseEvent):void;
		function inputTabAllow(e:MouseEvent,tabReplace?:string):void;
		function copyElement(div:Node):void;
		/**
		 * 深度遍历，先子后弟
		 * @param editor 
		 * @param visitor 
		 */
		function visit(editor:HTMLElement,visitor:(el:Node)=>(boolean|void)):void
		interface Range{
			start:number
			end:number
			dir?:"->"|"<-"
		}
		function getSelectionRange(editor:HTMLElement):Range
		function setSelectionRange(editor:HTMLElement,range:Range):Selection
	}

	namespace browser{
		const type:"IE"|"FF"|"Opera"|"Safari";
	}
}