import { DOMNode } from "../mve-DOM/index";

/**
 * 
 * @param p 
 */
export function generate<Branch,Leaf,T,FV>(p:{
	/**数据源 */
	data:(Branch|Leaf)[],
	/**初始一格如td，后续扩展colspan或rowspan*/
	cell(o:Branch|Leaf):T,
	/**祖链、全局、自己 */
	row(a:T[],b:FV[],c:Leaf):FV
	/**是否是枝节点 */
	isBranch(o:Branch|Leaf):o is Branch
	/**遍历枝节点 */
	forEach(o:Branch,fun:(v:Branch|Leaf,i:number)=>void):void
}):FV[]{
	const body:FV[]=[];
	const reduce=function(o:Branch|Leaf,parentArray:T[]){
		const thisArray=parentArray.concat(p.cell(o));
		if(p.isBranch(o)){
			//父节点
			p.forEach(o,function(child,i){
				reduce(child,thisArray);
			})
		}else{
			//视作叶子节点
			/**叶子节点换行**/
			body.push(p.row(thisArray,body,o));
		}
	}
	//祖宗链，自己->父->祖
	const parentArray:T[]=[];
	mb.Array.forEach(p.data,function(o){
		reduce(o,parentArray);
	});
	return body;
};
interface RightCell{
	left:VCell[],
	/**每一行的children*/
	children:DOMNode[]
}
class VCell{
	constructor(
		public readonly node:DOMNode
	){
		node.attr=node.attr||{}
		node.attr.colspan=1
		node.attr.rowspan=1
	}
	used=false
	private colspan=1
	private rowspan=1
	addColSpan(v:number){
		this.colspan+=v
		this.node.attr.colspan=this.colspan
	}
	addRowSpan(v:number){
		this.rowspan+=v
		this.node.attr.rowspan=this.rowspan
	}
}
export function toTrs<Branch,Leaf>(p:{
	/**根数据源 */
	data:(Branch|Leaf)[],
	/**创建一个叶子节点 */
	cell(o:Branch|Leaf):DOMNode,
	/**叶子节点的后续节点 */
	rightCells(o:Leaf):DOMNode[]
	/**是否是枝节点 */
	isBranch(o:Branch|Leaf):o is Branch
	/**遍历枝下的子节点 */
	forEach(o:Branch,fun:(v:Branch|Leaf,i:number)=>void):void
}){
	//最大深度
	let max=0
	const trs=generate<Branch,Leaf,VCell,RightCell>({
		data:p.data,
		isBranch:p.isBranch,
		forEach:p.forEach,
		cell(o){
			const m=p.cell(o);
			return new VCell(m)
		},
		row(array,body,o){
			const thisCell:VCell[]=[];
			mb.Array.forEach(array,function(cell){
				if(cell.used){
					//自父祖被上一行使用过。
					cell.addRowSpan(1)
				}else{
					//自父祖未被上一行使用，更新。
					thisCell.push(cell);
					cell.used=true
				}
			});
			if(max<array.length){
				const diff=array.length-max;
				max=array.length;
				//为别的项的最后一行的列更深至最大深度
				mb.Array.forEach(body,function(row){
					const len=row.left.length;
					const last=row.left[len-1];
					last.addColSpan(diff)
				});
			}else{
				//自己的列未达到最大深度，
				const len=array.length;
				const last=array[len-1];
				last.addColSpan(max-len)
			}
			return {
				left:thisCell,
				children:thisCell.map(v=>v.node).concat(p.rightCells(o))
			};
		}
	});
	return {
		/*生成的表结果，需要简单转化*/
		trs:trs,
		/**总跨列 */
		colspan:max//跨列
	}
};