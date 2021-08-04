declare namespace mb.ajax.require.cp{
	const query:{[key:string]:string}
	const act:string
	const page:{element:Node,init?():void,destroy?():void}
	function go(path:string,d?:{[key:string]:string|number|boolean}):void
	function back(i?:number):void
	function replace(path:string,d?:{[key:string]:string|number|boolean}):void
}