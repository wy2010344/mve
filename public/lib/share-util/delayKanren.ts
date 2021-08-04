import {KSubsitution, KType, KVar, Pair, UnifyQuery} from "./kanren";



export type VStream<V>=null | Pair<V,DVStream<V>>
type DVStreamNotice<V>=(v:VStream<V>)=>void
type DVStream<V>=(notice:DVStreamNotice<V>)=>void


export type DelayGoal<V>=(notice:DVStreamNotice<V>,sub?:V)=>void
export type DelayKGoal<T>=DelayGoal<KSubsitution<T>>
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
export function delayStreamBindGoal<V>(notice:DVStreamNotice<V>,a:VStream<V>,b:DelayGoal<V>){
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
	fail:<DelayKGoal<any>>function(notice,sub){
		notice(null)
	},
	success:<DelayKGoal<any>>function(notice,sub){
		notice(Pair.of(sub,emptyDelayStream))
	},
	query<T>(a:KType<T>,b:KType<T>,unify:UnifyQuery<T>):DelayKGoal<KType<T>>{
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
	or<T>(a:DelayKGoal<T>,b:DelayKGoal<T>):DelayKGoal<T>{
		return function(notice,sub){
			a(function(av){
				delayStreamAppendStream(notice,av,function(nv){
					b(nv,sub)
				})
			},sub)
		}
	},
	cut<T>(a:DelayKGoal<T>,b:DelayKGoal<T>):DelayKGoal<T>{
		return function(notice,sub){
			a(function(av){
				if(av){
					notice(av)
				}else{
					b(notice,sub)
				}
			},sub)
		}
	},
	and<T>(a:DelayKGoal<T>,b:DelayKGoal<T>):DelayKGoal<T>{
		return function(notice,sub){
			a(function(av){
				delayStreamBindGoal(notice,av,b)
			},sub)
		}
	}
}