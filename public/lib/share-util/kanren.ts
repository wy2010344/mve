export class Pair<L,R>{
  private constructor(
    public readonly left:L,
    public readonly right:R
  ){}
	static of<L,R>(left:L,right:R){
		return new Pair(left,right)
	}
	toString(){
		const left = this.left instanceof Pair ? `[${this.left.toString()}]` : this.left
		return `${left} -> ${this.right}`
	}
}
type NotNullList<T>=Pair<T,List<T>>
export type List<T>=NotNullList<T> | null
/**
 * 作用域链，空为基础，后继为
	* 存储所有的定义<KVar,KBaseType>
 */
type NotNullSubsitution<V> = Pair<V,Subsitution<V>>
export type Subsitution<V> = null | NotNullSubsitution<V>
/**
 * 平行可能行->所有作用域
 * 不同的世界线。没有，或有一个，但后继是空。
 */
type DelayStream<V>=()=>Stream<V>
export type Stream<V> = null | Pair<V,DelayStream<V>>
export const emptyDelayStream=()=>null
/**
 * 增加世界线b
 * 在a流查找后（包括a的所有后继），在b的流继续查找
 * @param a 
 * @param b 
 */
export function streamAppendStream<V>(a:Stream<V>,b:()=>Stream<V>):Stream<V>{
	if(a==null){
		return b()
	}else{
		//如果a有后继，追加到后继之后
		return Pair.of(a.left,function(){
			return streamAppendStream(a.right(),b)
		})
	}
}
/**
 * 与append对应的
 * @param a 
 * @param b 
 */
export function streamInterleaveStream<V>(a:Stream<V>,b:()=>Stream<V>):Stream<V>{
	if(a==null){
		return b()
	}else{
    return Pair.of(a.left,function(){
      return streamInterleaveStream(b(),a.right)
    })
	}
}

/**
 * 作用域扩展
 * @param key 
 * @param value 
 * @param parent 
 */
export function extendSubsitution<K,V>(key:K,value:V,parent:Subsitution<Pair<K,V>>){
	return Pair.of(Pair.of(key,value),parent)
}
/**
 * 求解目标，代入作用域在不同世界线上求解。
 * 作用域在同一世界线上是叠加的。
 */
export type Goal<V>=(sub?:Subsitution<V>)=>Stream<Subsitution<V>>
/**
 * 为所有的世界线应用一个条件，变换成新的世界线列表
 * 在a流中，使用b目标查找，每一个节点的尝试
 * 用于and语句。
 * @param a 
 * @param b 
 */
export function streamBindGoal<K,V>(a:Stream<Subsitution<Pair<K,V>>>,b:Goal<Pair<K,V>>):Stream<Subsitution<Pair<K,V>>>{
	if(a==null){
		return null
	}else{
		//如果a有后继流，则递归处理
		return streamAppendStream(b(a.left),function(){
			return streamBindGoal(a.right(),b)
		})
	}
}
/**
 * 
 * @param a 
 * @param b 
 */
export function streamBindiGoal<K,V>(a:Stream<Subsitution<Pair<K,V>>>,b:Goal<Pair<K,V>>):Stream<Subsitution<Pair<K,V>>>{
	if(a==null){
		return null
	}else{
		return streamInterleaveStream(b(a.left),function(){
			return streamBindiGoal(a.right(),b)
		})
	}
}

/**变量 */
export class KVar{
	static UID = 0
	constructor(public readonly flag:string=`${KVar.UID++}`){}
	toString(){
		return `Var(${this.flag})`
	}
	equals(v){
		return v==this || (v instanceof KVar && v.flag==this.flag)
	}
}
export type KList=Pair<KBaseType,KBaseType>
/**
 * 基础类型
 */
export type KBaseType = KVar | KList | string | number | boolean | null

export type KKVPair=Pair<KVar,KBaseType>
export type KSubsitution=Subsitution<KKVPair>
/**
 * 在作用域中寻找变量的定义
 * @param v 变量
 * @param sub 作用域
 */
function find(v:KVar,sub:KSubsitution):KKVPair|null{
  while(sub!=null){
    const kv=sub.left
    if(kv.left==v || v.equals(kv.left)){
      return kv
    }
    sub=sub.right
  }
  return null
}
/**
 * 替换定义，如果能找到替换则替换，不能保持变量
 * @param v 
 * @param sub 
 */
export function walk(v:KBaseType,sub:KSubsitution):KBaseType{
  if(v instanceof Pair){
    //列表，递归寻找
    return Pair.of(walk(v.left,sub),walk(v.right,sub))
  }else
  if(v instanceof KVar){
    const val=find(v,sub)
    if(val){
      //变量如果找到定义，对定义递归寻找
      return walk(val.right,sub)
    }
  }
  return v
}
/**
 * 合一算法
 * @param a 
 * @param b 
 * @param sub 
 */
function unify(a:KBaseType,b:KBaseType,sub:KSubsitution):[boolean,KSubsitution]{
  a=walk(a,sub)
  b=walk(b,sub)

  if(a == b){
	   return [true,sub]
	}
  if(a instanceof KVar){
		if(a.equals(b)){
			return [true,sub]
		}
    return [true,extendSubsitution(a,b,sub)]
  }
  if(b instanceof KVar){
		if(b.equals(a)){
			return [true,sub]
		}
    return [true,extendSubsitution(b,a,sub)]
  }
  if(a instanceof Pair && b instanceof Pair){
    const [success,sub1]=unify(a.left,b.left,sub)
    if(success){
      return unify(a.right,b.right,sub1)
    }else{
			return [false,null]
		}
  }
  //默认返回失败
  return [false,null]
}
export type KStream=Stream<KSubsitution>
export type KGoal=Goal<KKVPair>
export const kanren={
  fresh(){
    return new KVar()
  },
  fail:<KGoal>function(sub){
    return null
  },
  success:<KGoal>function(sub){
    return Pair.of(sub,emptyDelayStream)
  },
  pair(v1:KBaseType,v2:KBaseType){
    return Pair.of(v1,v2)
  },
  list(...args:KBaseType[]):List<KBaseType>{
    let ret:List<KBaseType> | null=null
    for(let i=args.length-1;i>-1;i--){
      ret=Pair.of(args[i],ret)
    }
    return ret
  },
	isVar(v:KBaseType):KGoal{
		return function(sub){
			if(v instanceof KVar){
				return kanren.success(sub)
			}else{
				return kanren.fail(sub)
			}
		}
	},
	notVar(v:KBaseType):KGoal{
		return function(sub){
			if(v instanceof KVar){
				return kanren.fail(sub)
			}else{
				return kanren.success(sub)
			}
		}
	},
	/**
	 * 叶子节点的世界线。
	 * 如果合一成功，则添加定义，返回一条世界线。
	 * 合一失败，则该世界线消失。
	 * @param a 
	 * @param b 
	 */
  eq(a:KBaseType,b:KBaseType):KGoal{
    return function(sub){
      const [success,sub1]=unify(a,b,sub)
      if(success){
        //合一成功，添加作用域
        return kanren.success(sub1)
      }
      //合一失败，返回空作用域
      return kanren.fail(sub1)
    }
  },
	/**
	 * 增加世界线
	 * 如果其中任意一个没有成功，比如是eq的goal，则只返回另一个goal，世界线并没有增加
	 * @param a 
	 * @param b 
	 */
  or(a:KGoal,b:KGoal):KGoal{
    return function(sub){
      return streamAppendStream(a(sub),function(){
        return b(sub)
    	})
    }
  },
	ori(a:KGoal,b:KGoal):KGoal{
		return function(sub){
			return streamInterleaveStream(a(sub),function(){
				return b(sub)
			})
		}
	},
	/**
	 * 为所有的世界线增加一个条件
	 * 如果其中任何一个goal没有成功，比如是eq的goal
	 * 如果a是空，则返回空。如果b是空，则所有a的世界线都会终结
	 * 追加a成功后追加b。
	 * @param a 
	 * @param b 
	 */
  and(a:KGoal,b:KGoal):KGoal{
    return function(sub){
      return streamBindGoal(a(sub),b)
    }
  },
	andi(a:KGoal,b:KGoal):KGoal{
		return function(sub){
			return streamBindiGoal(a(sub),b)
		}
	},
	all(...gs:KGoal[]):KGoal{
		if(gs.length==0){return kanren.success}
		if(gs.length==1){return gs[0]}
		return kanren.and(gs[0],kanren.all.apply(null,gs.slice(1)))
	},
	alli(...gs:KGoal[]):KGoal{
		if(gs.length==0){return kanren.success}
		if(gs.length==1){return gs[0]}
		return kanren.andi(gs[0],kanren.alli.apply(null,gs.slice(1)))
	},
	any(...gs:KGoal[]):KGoal{
		if(gs.length==0){return kanren.fail}
		if(gs.length==1){return gs[0]}
		return kanren.or(gs[0],kanren.any.apply(null,gs.slice(1)))
	},
	anyi(...gs:KGoal[]):KGoal{
		if(gs.length==0){return kanren.fail}
		if(gs.length==1){return gs[0]}
		return kanren.ori(gs[0],kanren.anyi.apply(null,gs.slice(1)))
	}
}