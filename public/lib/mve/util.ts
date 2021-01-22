class Dep{
  static uid=0
  static target?:mve.Watcher
  id=Dep.uid++
  subs:{[key:number]:mve.Watcher}={}
  depend(){
    if(Dep.target){
      this.subs[Dep.target.id]=Dep.target
    }
  }
  notify(){
    const oldSubs=this.subs
    this.subs={}
    for(const key in oldSubs){
      oldSubs[key].update()
    }
  }
}
const DEP_KEY="__Dep__"
if(window[DEP_KEY]){
  throw `重复加载了${pathOf()}导致mve出现了问题`
}
window[DEP_KEY]=Dep

export namespace mve{
  /**只读形式*/
  export type GValue<T>=()=>T
  /**值或获得值*/
	export type TValue<T>=T|GValue<T>
	/**延迟设置具体属性值 */
	export interface MDelaySet<T>{
		after(v:T,set:(v:T)=>void):void
		():T
	}
	export function delaySetAfter<T>(fun:()=>T,after:(v:T,set:(v:T)=>void)=>void):MDelaySet<T>{
		const newFun=fun as MDelaySet<T>
		newFun.after=after
		return newFun
	}
	/**属性节点可以的类型 */
	export type MTValue<T>=TValue<T>|MDelaySet<T>
  /**存储器 */
  export interface Value<T>{
    (v:T):void
    ():T
  }
  /**新存储器*/
  export function valueOf<T>(v:T):Value<T>{
    const dep=new Dep()
    return function(){
      if(arguments.length==0){
        dep.depend()
        return v
      }else{
        if(Dep.target){
          throw "计算期间不允许修改"
        }else{
          v=arguments[0]
          dep.notify()
        }
      }
    }
  }
  export function valueOrCall<T>(a:TValue<T>):mve.GValue<T>{
    if(typeof(a)=='function'){
      return a as mve.GValue<T>
    }else{
      return function(){return a}
    }
	}
	/**
	 * 重写属性值为可观察
	 * @param a 
	 * @param fun 
	 */
	export function reWriteMTValue<T,V>(a:MTValue<T>,fun:(v:T)=>V){
		if(typeof(a)=='function'){
			const after=a['after']
			const vm=function(){return fun((a as GValue<T>)())}
			vm.after=after
			return vm
		}else{
			if(a){
				return function() {return fun(a)}
			}
		}
	}
	export function reWriteMTValueNoWatch<T,V>(a:MTValue<T>,fun:(v:T)=>V){
		if(typeof(a)=='function'){
			const after=a['after']
			const vm=function(){return fun((a as GValue<T>)())}
			vm.after=after
			return vm
		}else{
			if(a){
				return fun(a)
			}
		}
	}
  export interface ArrayModelView<T>{
    insert(index:number,row:T):void
    remove(index:number):void
    move(oldIndex:number,newIndex:number):void
	}
	/**构造只读的模型*/
	export class CacheArrayModel<T> implements BaseReadArray<T>{
		constructor(
			public readonly size:GValue<number>,
			private readonly array:T[],
			private readonly views:ArrayModelView<T>[]
		){}
    addView(view:ArrayModelView<T>){
      this.views.push(view);
			//自动初始化
      for(var i=0;i<this.array.length;i++){
        view.insert(i,this.array[i])
      }
    }
    removeView(view:ArrayModelView<T>){
      var index=mb.Array.indexOf(this.views,view);
      if (index!=-1) {
        this.views.splice(index,1);
      }
    }
		get(i: number): T {
			//不支持响应式
			return this.array.get(i)
		}
		getLast(): T {
			return mb.Array.getLast(this)
		}
		findIndex(fun: (v: T, i: number) => boolean): number {
			return mb.Array.findIndex(this,fun)
		}
    forEach(fun:(row:T,i:number)=>void){
			mb.Array.forEach(this,fun)
    }
    map<V>(fun:(row:T,i:number)=>V){
			return mb.Array.map(this,fun)
    }
    reduce<V>(fun:(init:V,row:T,i:number)=>V,init:V){
			return mb.Array.reduce(this,fun,init)
    }
    filter(fun:(row:T,i:number)=>boolean){
			return mb.Array.filter(this,fun)
		}
		findRow(fun:(row:T,i:number)=>boolean){
			return mb.Array.findRow(this,fun)
		}
    indexOf(row:T){
      return this.findIndex(theRow=>theRow==row);
    }
	}
  export class ArrayModel<T> extends CacheArrayModel<T> implements BaseArray<T>{
    private readonly views_value:ArrayModelView<T>[];
		private readonly size_value:mve.Value<number>;
		private readonly array_value:T[]
    constructor(array?:T[]) {
      array=mb.Array.map(array||[],function(row){
       return row;
      });
			const size_value=mve.valueOf(0);
			const views_value:ArrayModelView<T>[]=[]
			super(size_value,array,views_value)
			this.size_value=size_value
			this.array_value=array
      this.views_value=views_value;
			//长度是可观察的
			this.reload_size();
    }
    private reload_size(){
      this.size_value(this.array_value.length);
    }
    insert(index:number,row:T){
      this.array_value.splice(index,0,row);
      mb.Array.forEach(this.views_value,function(view){
        view.insert(index,row);
      });
      this.reload_size();
    }
    remove(index:number){
      /*更常识的使用方法*/
      var row=this.get(index);
      this.array_value.splice(index,1);
      mb.Array.forEach(this.views_value,function(view){
        view.remove(index);
      });
      this.reload_size();
      return row;
		}
		/**清理匹配项 */
		removeWhere(fun:(row:T,i:number)=>boolean){
			mb.Array.removeWhere(this,fun)
		}
		/**清理单纯相等的项 */
		removeEqual(row:T){
			this.removeWhere(theRow=>theRow==row)
		}
		move(oldIndex:number,newIndex:number){
			/**有效的方法*/
			mb.Array.move(this.array_value,oldIndex,newIndex)
			mb.Array.forEach(this.views_value,function(view){
				view.move(oldIndex,newIndex);
			});
			this.reload_size()
		}
    /*多控件用array和model，单控件用包装*/
    moveToFirst(index:number) {
      this.move(index,0);
    }
    moveToLast(index:number){
      this.move(index,this.size_value()-1);
    }
    shift(){
      return this.remove(0);
    }
    unshift(row:T){
      return this.insert(0,row)
    }
    pop(){
      return this.remove(this.size_value()-1);
    }
    push(row:T){
      return this.insert(this.size_value(),row);
    }
    clear(){
      while(this.size_value()>0){
        this.pop();
      }
    }
    reset(array?:T[]){
      this.clear();
      const that=this;
      mb.Array.forEach(array||[],function(row){
        that.push(row);
     });
		}
  }
  export function arrayModelOf<T>(array:T[]){
    return new ArrayModel(array)
  }

  export abstract class Watcher{
    static uid=0
    id=Watcher.uid++
    private enable=true
    update(){
      if(this.enable){
        this.realUpdate()
      }
    }
    disable(){
      this.enable=false
    }
    protected abstract realUpdate():void;
  }
  
  export function Watch(exp:()=>void){
    return new WatcherImpl(exp)
  }

  export function WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void){
    return new WatcherImplExp(before,exp,after)
  }

  export function WatchBefore<A>(before:()=>A,exp:(a:A)=>void){
    return new WatcherImplBefore(before,exp)
  }

  export function WatchAfter<B>(exp:()=>B,after:(b:B)=>void){
    return new WatcherImplAfter(exp,after)
  }

  export interface LifeModel{
    Watch(exp:()=>void):void
    WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void):void
    WatchBefore<A>(before:()=>A,exp:(a:A)=>void):void
    WatchAfter<B>(exp:()=>B,after:(b:B)=>void):void
    Cache<T>(fun:()=>T):()=>T
  }

  class LifeModelImpl implements LifeModel{
    private pool:Watcher[]=[]
    Watch(exp){
      this.pool.push(mve.Watch(exp))
    }
    WatchExp(before,exp,after){
      this.pool.push(mve.WatchExp(before,exp,after))
    }
    WatchBefore(before,exp){
      this.pool.push(mve.WatchBefore(before,exp))
    }
    WatchAfter(exp,after){
      this.pool.push(mve.WatchAfter(exp,after))
    }
    Cache(fun){
      const dep=new Dep()
      let cache
      this.Watch(function(){
        cache=fun()
        dep.notify()
      })
      return function(){
        dep.depend()
        return cache
      }
    }
    destroy(){
      while(this.pool.length>0){
        this.pool.pop().disable()
      }
    }
  }
  export function newLifeModel():{
    me:LifeModel,
    destroy():void
  }{
    const lm=new LifeModelImpl()
    return {
      me:lm,
      destroy(){
        lm.destroy()
      }
    }
  }
  export type LifeModelReturn=ReturnType<typeof newLifeModel>
}

class WatcherImpl extends mve.Watcher{
  constructor(
    public readonly exp:()=>void
  ){
    super()
    this.update()
  }
  realUpdate(){
    Dep.target=this
    this.exp()
    Dep.target=null
  }
}
class WatcherImplExp<A,B> extends mve.Watcher{
  constructor(
    public readonly before:()=>A,
    public readonly exp:(a:A)=>B,
    public readonly after:(b:B)=>void
  ){
    super()
    this.update()
  }
  realUpdate(){
    const a=this.before()
    Dep.target=this
    const b=this.exp(a)
    Dep.target=null
    this.after(b)
  }
}
class WatcherImplBefore<A> extends mve.Watcher{
  constructor(
    public readonly before:()=>A,
    public readonly exp:(a:A)=>void
  ){
    super()
    this.update()
  }
  realUpdate(){
    const a=this.before()
    Dep.target=this
    this.exp(a)
    Dep.target=null
  }
}
class WatcherImplAfter<B> extends mve.Watcher{
  constructor(
    public readonly exp:()=>B,
    public readonly after:(b:B)=>void
  ){
    super()
    this.update()
  }
  realUpdate(){
    Dep.target=this
    const b=this.exp()
    Dep.target=null
    this.after(b)
  }
}

export type EmptyFun=()=>void
export function orRun(v?:EmptyFun){
  if(v){v()}
}
export interface BuildResult{
	init?():void,
	destroy?():void
}
export function orInit(v:BuildResult){
  if(v.init){
    v.init()
  }
}
export function orDestroy(v:BuildResult){
  if(v.destroy){
    v.destroy()
  }
}
export class BuildResultList{
  private constructor(){}
  static init(...xs:BuildResult[]){
    const it=new BuildResultList()
    for(let i=0;i<xs.size();i++){
      it.push(xs.get(i))
    }
    return it
  }
  private inits:EmptyFun[]=[]
  private destroys:EmptyFun[]=[]
  orPush(v?:BuildResult){
    if(v){
      this.push(v)
    }
  }
  push(v:BuildResult){
    if(v.init){
      this.inits.push(v.init)
    }
    if(v.destroy){
      this.destroys.push(v.destroy)
    }
  }
  getInit(){
    const inits=this.inits
    const size=inits.size()
    if(size>1){
      return function(){
        for(let i=0;i<size;i++){
          inits[i]()
        }
      }
    }else
    if(size==1){
      return inits[0]
    }
  }
  getDestroy(){
    const destroys=this.destroys
    const size=destroys.size()
    if(size>1){
      return function(){
        for(let i=size-1;i>-1;i--){
          destroys[i]()
        }
      }
    }else
    if(size==1){
      return destroys[0]
    }
  }
  getAsOne(){
    return {
      init:this.getInit(),
      destroy:this.getDestroy()
    } as BuildResult
  }
}
/**单元素的解析返回*/
export interface EOParseResult<EO> extends BuildResult{
  element:EO
}
export function onceLife<T extends BuildResult>(p:T){
  const self={
    isInit:false,
    isDestroy:false,
    out:p
  }
  const init=p.init
  if(init){
    p.init=function(){
      if(self.isInit){
        mb.log("禁止重复init")
      }else{
        self.isInit=true
        init()
      }
    }
  }
  const destroy=p.destroy
  if(destroy){
    p.destroy=function(){
      if(self.isDestroy){
        mb.log("禁止重复destroy")
      }else{
        self.isDestroy=true
        if(self.isInit){
          destroy()
        }else{
          mb.log("未初始化故不销毁")
        }
      }
    }
  }
  return self
}