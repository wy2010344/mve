interface MveValue<T> {
	(): T;
	(t: T): void;
}

interface MveWatchParam<B, A> {
	before?: () => B;
	exp: (v: B) => A;
	after?: (v: A) => void;
}
declare class MveArrayModel<T>{
	insert(index:number,row:T);
	removeAt(index:number);
	remove(row:T);
	move(row:T,target_row:T);
	moveTo(row:T,target_index:number);
	moveToFirst(row:T);
	moveToLast(row:T);
	get(index:number):T;
	shift():T;
	unshift(row:T);
	pop():T;
	push(row:T);
	clear();
	forEach();
	map();
	reduce();
	filter();
	find_index(fun:(t:T)=>boolean):number;
	indexOf(row:T):number;
	find_row(fun:(t:T)=>boolean):T;
	size():number;
}
interface MveChildrenTransDown{
	<T>(a:MveArrayRepeat<T>):MveArrayRepeat<any>;
	<T>(a:MveModelRepeat<T>):MveModelRepeat<any>;
}
interface MveInner{
	readonly k:any;
	readonly Value: (<T>(t: T) => MveValue<T>);
	readonly ReadValue:(<T>(v:MveValue<T>)=>(()=>T));
	readonly Watch: <B,A>(v: MveWatchParam<B,A>) => void;
	readonly Cache: (<T>(v:(() => T))=> (()=> T));
	readonly ArrayModel: <T>(array?:T[])=>MveArrayModel<T>;
	readonly children:MveChildrenTransDown;
}
interface MveArrayRepeat<T>{
	array:()=>T[];
	before?:MveViewItem[];
	repeat:(me:MveInner,row:()=>T,index:number)=>MveOutter;
	after?:MveViewItem[];
}

interface MveModelRepeat<T>{
	model:MveArrayModel<T>;
	before?:MveViewItem[];
	repeat:(me:MveInner,row:T,index:()=>number)=>MveOutter;
	after?:MveViewItem[];
}
/**
 * 允许的Mve元素节点
 */
type MveViewItem=MveElement | string | MveSelfItem | MveReturn;
/**
 * 允许作为children的节点
 */
type MveChildrenType=MveViewItem[] | MveArrayRepeat<any> | MveModelRepeat<any>;

/**
 * 目前的自定义组件
 */
interface MveSelfItem{
	mve:MveReturn;
	id?:string
}
/**
 * 泛型观察对象
 */
type MveTValue<T>=T|(()=>T);
/**
 * 要么是值，要么返回值的函数
 */
type MveItemValue=MveTValue<string>;
//attr或style
type MveItemMap={ [key: string]: MveItemValue}
interface MveElement {
	type: string;
	id?:string;
	text?: MveItemValue;
	cls?:string;
	value?: MveItemValue;
	attr?: MveItemMap;
	style?: MveItemMap;
	action?: { [key: string]: ((e: Event) => void) };
	fragment?: JSDOMElement[] | (() => JSDOMElement[]);
	element?: JSDOMElement | (() => JSDOMElement);
	children?:  MveChildrenType;
}
/**
 * mve中内部函数返回
 */
interface MveOutter {
	out?:any;
	init?: () => void;
	destroy?: () => void;
	element: MveViewItem;
}
/**
 * mve外部最终返回
 */
interface MveFinally{
	out?:any;
	init: () => void;
	destroy: () => void;
	element: HTMLElement;
}
interface MveForReturnToFinally{
	pel:HTMLElement,
	replaceChild?:any
}
interface MveReturn {
	(x:MveForReturnToFinally):MveFinally
}
declare function mve(fun:(me: MveInner)=> MveOutter):MveReturn;
declare namespace mve{
	const Value:(<T>(t: T) => MveValue<T>);
}