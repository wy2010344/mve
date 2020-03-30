


declare namespace mve{
	namespace dom{
		interface IElement {
			type: string;
			id?:string|((o:any)=>void);
			NS?:string;
			text?: MveItemValue;
			content?:MveItemValue;
			cls?:mve.StringValue;
			value?: MveItemValue;
			attr?: MveItemMap;
			style?: mve.StringMap;
			prop?:{ [key: string]:TValue<string|number|boolean>};
			action?: { [key: string]: ((e: Event) => void) };
			fragment?: JSDOMElement| JSDOMElement[] | (() => (JSDOMElement|JSDOMElement[]));
			children?:  ChildrenType;//应该有object和array，object可以是array的单元素
		}

		type SElement=string | IElement;

		/**
		 * 兼容性考虑
		 */
		type ChildrenType=mve.MViewItem<SElement> | mve.MViewItem<SElement>[]
	}
}
type MveValue<T>=mve.Value<T>;
type MveArrayModel<T>=mve.TArrayModel<T>
type MveItemValue=mve.StringValue | mve.TValue<number>;
type MveItemMap={ [key: string]: mve.TValue<string|number>};
type MveInner=mve.OldInner;
type MveElement=mve.dom.IElement;
type MveViewItem=mve.ViewItem<mve.dom.SElement>;
type MveOutter=mve.EWithLife<mve.dom.SElement>;
type MveEOutter=mve.EWithLife<mve.dom.IElement>;
/**
 * 允许作为children的节点
 */
type MveChildrenType=mve.dom.ChildrenType;
type MveReturn=mve.Return;
/**
 * 1.mve变成透传的，减少对外类型的暴露----不作此大改动，只是警告，可以使用outter作参数，即推荐使用2
 * 2.自定义组件会嵌套，接受外部传入的me(与外部生命周期一致)，返回element\inits\destroys，自动收集，不需要全局的mve
 * 3.只有有生命周期的才用me，动态组件if,repeat,因为id渐渐淘汰，所以不考虑。内嵌套的函数类型，默认是if，则又要分列表与单个。总之带me的都是整体创建与销毁的。
 * 	 尽量不去占用函数单节点，用me.xxx来生成单节点函数，未来重构容易，支持multi和single
 * @param fun 
 */
declare function mve(fun:(me: mve.Inner)=> mve.ViewItem<mve.dom.SElement>):mve.Return;
declare namespace mve{
	function render(fun:RenderSelfFun<mve.dom.SElement>):mve.RenderSelf<mve.dom.SElement>;
	function renders(fun:RenderMultiFun<mve.dom.SElement>):RenderMulti<mve.dom.SElement>;
	function repeat<T>(array:()=>T[],repeat:(me:Inner,row:T,index:number)=>mve.RepeatOutter<mve.dom.SElement>):ArrayRepeat<any,mve.dom.SElement>;
	function repeat<T>(model:TArrayModel<T>,repeat:(me:Inner,row:T,index:()=>number)=>mve.RepeatOutter<mve.dom.SElement>):ModelRepeat<any,mve.dom.SElement>;
	/**@description 兼容，只有一个子节点的简单写法？*/
	function children<T>(a:ArrayRepeat_old<T,mve.dom.SElement>):ViewItem<mve.dom.SElement>[];
	/**@description */
	function children<T>(a:ModelRepeat<T,mve.dom.SElement>):ViewItem<mve.dom.SElement>[];
	//svg部分
	const svg_NS:string;
	function svg(fun:(me: mve.Inner)=> mve.ViewItem<mve.dom.SElement>):mve.Return;
	/**
	 * 兼容svg等
	 * @param r 
	 */
	function svgCompatible(r:mve.Return):mve.ViewItem<mve.dom.IElement>
}