
declare namespace mb{
	namespace Function{
		interface Quote{
			one(a:any):any
			one():void;
		}
		const quote:Quote

		interface Equal{
			one<T>(a:T,b:T):boolean
		}
		const equal:Equal

		interface AsNull{
			one():null
		}
		const as_null:AsNull

		interface List{
			one<T>(...vs:T[]):T[]
		}
		const list:List
		const or_run:(fun?:()=>void)=>void
	}
	

	namespace Array{
		function getLast<T>(vs:BaseReadArray<T>):T
		function forEach<T>(vs:BaseReadArray<T>,fun:(row:T,index:number)=>void):void;
		function map<T,V>(vs:BaseReadArray<T>,fun:(row:T,index:number)=>V):V[];
		function flatMap<T,V>(vs:BaseReadArray<T>,fun:(row:T,index:number)=>BaseReadArray<T>):V[]
		function findRow<T>(vs:BaseReadArray<T>,fun:(v:T,index:number)=>boolean):T;
		function findIndex<T>(vs:BaseReadArray<T>,fun:(v:T,index:number)=>boolean):number;
		function reduce<T,V>(vs:BaseReadArray<T>,fun:(v:V,t:T,i:number)=>V,init:V):V;
		function some<T>(vs:BaseReadArray<T>,fun:(t:T,i:number)=>boolean):boolean
		function every<T>(vs:BaseReadArray<T>,fun:(t:T,i:number)=>boolean):boolean
		function filter<T>(vs:BaseReadArray<T>,fun:(t:T,i:number)=>boolean):T[];
		function indexOf<T>(vs:BaseReadArray<T>,x:any):number;
		function isArray(o:any):o is any[];
		function removeWhere<T>(vs:BaseArray<T>,fun:(row:T,i:number)=>boolean):void
		function removeEqual<T>(vs:BaseArray<T>,row:T):void
		function move<T>(vs:T[],oldIndex:number,newIndex:number):void
	}

	namespace Object{
		function forEach<T>(vs:{[key:string]:T},fun:(v:T,k:string)=>void):void;
		function map<T,V>(vs:{[key:string]:T},fun:(v:T,k:string)=>V):{[key:string]:V};
		function toArray<T,V>(vs:{[key:string]:T},fun:(v:T,k:string)=>V):V[];
		/**
		 * 用other去覆盖m,并返回m。
		 * 类似于原生中的Object.assign
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
		function size<T>(m:{[key:string]:T}):number
	}

	namespace Date{
		/**格式化 yyyy-MM-dd HH:mm:ss*/
		function stringify(v:Date,format:string):string
		/**获取年月下的天数*/
		function getDays(year:number,month:number):number
	}

	namespace repeat{
		function forEach(n:number,fun:(i:number)=>void):void
		function map<T>(n:number,fun:(i:number)=>T):T[]
	}
}


declare interface Date{
	format(v:string):string;
}

declare interface String{
	endsWith(v:string):boolean
	startsWith(v:string):boolean
}
/**只读列表*/
declare interface BaseReadArray<T>{
	size():number
	get(i:number):T
}
/**可读写列表 */
declare interface BaseArray<T> extends BaseReadArray<T>{
	insert(i:number,v:T):void
	remove(i:number):void
	move(oldI:number,newI:number):void
	clear():void
}
declare interface Array<T> extends BaseArray<T>{
	find(fun:(v:T,i:number)=>boolean):T
	getLast():T
	findIndex(fun:(v:T,i:number)=>boolean):number
}

declare class Promise<T> {
	constructor(fun:(resolve:T,reject:Error)=>void)
	then<F>(onSuccess?:(value:T)=>F,onFail?:(error:Error)=>F):Promise<F>
}
declare function parseInt(s: number):number