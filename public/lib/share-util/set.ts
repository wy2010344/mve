

/**
 * 集合元素
 */
export type MSetType=string|number|boolean|null|MSetItem|MSetType[]
/**
 * 复合类型，分治到具体类型去对比
 * 列表类型？列表也有链类型。单纯的js列表，也可能在复合类型中对比。
 */
export interface MSetItem{
  /**当不是同一个对象时，是否相同*/
  equalsWhenNotSame(right:MSetType):boolean
}
/**两个集合对象是否相同*/
export function isSetItemEqual(a:MSetType,b:MSetType):boolean{
  if(a==b){
    return true
  }else{
    if(a && typeof(a)=='object'){
			if(mb.Array.isArray(a)){
				return isSetListEqual(a,b)
			}else{
				return a.equalsWhenNotSame(b)
			}
    }else
    if(b && typeof(b)=='object'){
			if(mb.Array.isArray(b)){
				return isSetListEqual(b,a)
			}else{
				return b.equalsWhenNotSame(a)
			}
    }
  }
  return false
}
/**两个列表是否匹配*/
export function isSetListEqual(as:MSetType[],bs:MSetType):boolean{
	if(mb.Array.isArray(bs)){
		if(as.length==bs.length){
			let r=true
			for(let i=0;i<as.length;i++){
				r=isSetItemEqual(as[i],bs[i]) && r
			}
			return r
		}
	}
  return false
}

/**
 * 抽象的集合类
 * 
 * 类似数据库的方法
 * 
 * 判断是否是真子集，取补集为空
 * 
 * 
 * 集合不一定能取交集
 * 但一定能判断包含
 * 部分集合能明确地取交集
 * 可以用泛型圈定集合演算的范围
 * 
 * 
 * 类型是集合的演算，元素之上是类型。
 * 集合也需要判断是否是子集合，便是类型的兼容性。
 * 
 */
export abstract class MSet{
	/**是否包含某集合元素 */
	abstract contain(right:MSetType):boolean
}
/**有限集合只有这一个*/
export class MLimitSet extends MSet implements MSetItem{
	////////////////////////////////////////////////
  /**当不是同一个对象时，是否 */
  equalsWhenNotSame(right: MSetType): boolean {
    if(right instanceof MLimitSet && right.set.length == this.set.length){
			return this.set.every(v=>right.contain(v))
    }
    return false
	}
	/////////////////////////////////////////////
	contain(v:MSetType){
		return this.containAt(v) > -1
	}
	//////////////////////////////////////////////
	size(){return this.set.length}
	innerJoin(right: MSet): MLimitSet {
		const set=new MLimitSet()
		this.forEach(v=>{
			if(right.contain(v)){
				set.set.push(v)
			}
		})
		return set
	}
	outterJoin(right: MLimitSet): MLimitSet {
		const set=new MWriteSet()
		set.set=this.set.map(v=>v)
		for(let i=0;i<right.size();i++){
			set.push(right.get(i))
		}
		return set
	}
	/**left-right*/
	private static leftNullJoin(left:MLimitSet,right:MSet){
		const set=new MWriteSet()
		const size=left.size()
		for(let i=0;i<size;i++){
			const v=left.get(i)
			if(!left.contain(v)){
				set.set.push(v)
			}
		}
		return set
	}
	leftNullJoin(right: MSet): MSet {	
		return MLimitSet.leftNullJoin(this,right)
	}
	rightNullJoin(right: MLimitSet): MSet {
		return MLimitSet.leftNullJoin(right,this)
	}
	nullJoin(right: MLimitSet): MLimitSet {
		const set=new MWriteSet()
		set.set=this.set.map(v=>v)
		const size=right.size()
		for(let i=0;i<size;i++){
			const v=right.get(i)
			if(set.remove(v)<0){
				set.set.push(v)
			}
		}
		return set
	}
	get(index:number){
		return this.set[index]
	}
	/////////////////////////////////////////
	protected set:MSetType[]=[]
	forEach(fun:(row:MSetType,index:number)=>void){
		for(let i=0;i<this.set.length;i++){
			fun(this.set[i],i)
		}
	}
  /**
   * 是否包含该元素，未找到，返回-1
   * @param v 
   */
  containAt(v:MSetType){
    for(let i=0;i<this.set.length;i++){
      const item=this.set[i]
      if(isSetItemEqual(item,v)){
        return i
      }
    }
    return -1
	}
}
/**
 * 可读写集合，只能作计算，不能作值
 */
export class MWriteSet extends MLimitSet{
	static from(v:MLimitSet){
		const set=new MWriteSet()
		v.forEach(v=>{
			set.set.push(v)
		})
		return set
	}
	/**增加成功的标识 */
	static ADD_SUCCESS=-1
	/**插入越界 */
	static INSERT_FAILED=-2
	/**
	 * 插入，如果越界返回-2，如果成功返回-1，如果失败返回存在的位置
	 * @param index 
	 * @param v 
	 */
	insert(index:number,v:MSetType){
		if(index<0 || index > this.size()){
			return -2
		}
		const existIdx=this.containAt(v)		
		if(existIdx<0){
			this.set.splice(index,0,v)
		}
		return existIdx
	}
	/**
	 * 增加集合元素到最前面，如果已经存在，则返回存在元素位置
	 * @param v 
	 */
	unshift(v:MSetType){
		const existIdx=this.containAt(v)
		if(existIdx<0){
			this.set.unshift(v)
		}
		return existIdx
	}
  /**
	 * 增加集合元素在最后，如果已经存在，则返回存在元素的位置
	 * @param v 被增加的元素
	 */
  push(v:MSetType){
		const existIdx=this.containAt(v)
		if(existIdx<0){
			this.set.push(v)
		}
		return existIdx
  }
  /**
	 * 
   * 移除集合元素，如果未找到，返回-1
   * @param v 被移除集合元素
	 */
  remove(v:MSetType){
    const index=this.containAt(v)
    if(index>-1){
			this.set.splice(index,1)
			return index
    }else{
			return -1
    }
	}
}

/**
 * 利用集合的交换律+结合律来归一化。
 * 变成一个大项的集合
 * 枚举项集合元素的化简。
 * 
 * 匹配规则的集合能演算（比如有限集合），不能匹配的不能演算。
 * 甚至交叉型类型(乘集合)
 * 只有contain的集合，只能累加出一份逻辑性的校验公式，对值进行判断。
 * 
 * 类型校验时，只是校验下一层的集合是否包含上一层呢（真子集）
 * 
 * 事实上在drawProgram里面，自定义类型，类型自己去判断是否是上一层的类型，
 * 所以类型之间有内部演算。每个节点都有类型名字。
 */

/**和型集合 */
export class MAddSet extends MSet{
	constructor(
		public readonly left:MSet,
		public readonly right:MSet
	){super()}
	contain(right: MSetType): boolean {
		return this.left.contain(right) || this.right.contain(right)
	}
}
/**差型集合 */
export class MSubSet extends MSet{
	constructor(
		public readonly left:MSet,
		public readonly right:MSet
	){super()}
	contain(right: MSetType): boolean {
		return this.left.contain(right) && !this.right.contain(right)
	}
}
export const mJoin={
	/**left-right */
	leftNullJoin(left:MSet,right: MSet):MSubSet{
		return new MSubSet(left,right)
	},
	/**right-left */
	rightNullJoin(left:MSet,right:MSet):MSubSet{
		return new MSubSet(right,left)
	},
	/**left+right */
	outterJoin(left:MSet,right:MSet):MAddSet{
		return new MAddSet(left,right)
	},
	/**(left-right)+(right-left)*/
	nullJoin(left:MSet,right:MSet):MAddSet{
		return new MAddSet(mJoin.leftNullJoin(left,right),mJoin.rightNullJoin(left,right))
	},
	/**(left+right)-[(left-right)+(right-left)]*/
	innerJoin(left:MSet,right:MSet):MSubSet{
		return new MSubSet(mJoin.outterJoin(left,right),mJoin.innerJoin(left,right))
	}
}
/**无限字符串集合*/
export class MStringSet extends MSet implements MSetItem{
	private constructor(){super()}
	static instance=new MStringSet()
	contain(right: MSetType): right is string {
		return typeof(right)=='string'
	}
	equalsWhenNotSame(right: MSetType): boolean {
		return right instanceof MStringSet
	}
}
/**无限数字集合*/
export class MNumberSet extends MSet implements MSetItem{
	private constructor(){super()}
	contain(right: MSetType): boolean {
		return typeof(right)=='number'
	}
	static instance=new MNumberSet()
	equalsWhenNotSame(right: MSetType): boolean {
		return right instanceof MNumberSet
	}
}