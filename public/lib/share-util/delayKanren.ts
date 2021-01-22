import { KBaseType, KKVPair, KVar, Pair, Subsitution, unify } from "./kanren";



export type VStream<V>=null | Pair<V,DVStream<V>>
type DVStreamNotice<V>=(v:VStream<V>)=>void
type DVStream<V>=(notice:DVStreamNotice<V>)=>void


export type DelayGoal<V>=(notice:(stream:VStream<Subsitution<V>>)=>void,sub?:Subsitution<V>)=>void
export type DelayKGoal=DelayGoal<KKVPair>
export function delayStreamAppendStream<V>(notice:DVStreamNotice<V>,a:VStream<V>,b:DVStream<V>){
	if(a==null){
		b(notice)
	}else{
		notice(Pair.of(a.left,function(nv){
			a.right(function(av){
				delayStreamAppendStream(nv,av,b)
			})
		}))
	}
}
export function delayStreamBindGoal<V>(notice:DVStreamNotice<Subsitution<V>>,a:VStream<Subsitution<V>>,b:DelayGoal<V>){
	if(a==null){
		notice(null)
	}else{
		b(function(bv){
			delayStreamAppendStream(notice,bv,function(nv){
				a.right(function(av){
					delayStreamBindGoal(nv,av,b)
				})
			})
		},a.left)
	}
}

export const emptyDelayStream:DVStream<any>=(notice)=>notice(null)
export const delayKanren={
  fresh(){
    return new KVar()
  },
  fail:<DelayKGoal>function(notice,sub){
		notice(null)
  },
  success:<DelayKGoal>function(notice,sub){
		notice(Pair.of(sub,emptyDelayStream))
  },
	eq(a:KBaseType,b:KBaseType):DelayKGoal{
		return function(notice,sub){
			const [success,sub1]=unify(a,b,sub)
			if(success){
			  //合一成功，添加作用域
				delayKanren.success(notice,sub1)
			}else{
				//合一失败，返回空作用域
				delayKanren.fail(notice,sub1)
			}
		}
	},
	or(a:DelayKGoal,b:DelayKGoal):DelayKGoal{
		return function(notice,sub){
			a(function(av){
				delayStreamAppendStream(notice,av,function(nv){
					b(nv,sub)
				})
			},sub)
		}
	},
	and(a:DelayKGoal,b:DelayKGoal):DelayKGoal{
		return function(notice,sub){
			a(function(av){
				delayStreamBindGoal(notice,av,b)
			},sub)
		}
	}
}