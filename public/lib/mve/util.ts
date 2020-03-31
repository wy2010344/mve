


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
    for(let key in oldSubs){
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
  export type TValue<T>=T|(()=>T)
  export interface Value<T>{
    (v:T):void
    ():T
  }
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
  export interface ArrayModelView<T>{
    insert(index:number,row:T):void
    remove(index:number):void
    move(oldIndex:number,newIndex:number):void
  }
  export class ArrayModel<T>{
    private _array:T[];
    private _views:ArrayModelView<T>[];
    size:mve.Value<number>;
    constructor(array?:T[]) {
     this._array=mb.Array.map(array||[],function(row){
       return row;
     });
     this._views=[];
     //长度是可观察的
     this.size=mve.valueOf(0);
     this._reload_size_();
    }
    _reload_size_(){
      this.size(this._array.length);
    }
    addView(view:ArrayModelView<T>){
      this._views.push(view);
      //自动初始化
      for(var i=0;i<this._array.length;i++){
        view.insert(i,this._array[i])
      }
    }
    removeView(view:ArrayModelView<T>){
      var index=mb.Array.indexOf(this._views,view);
      if (index!=-1) {
        this._views.splice(index,1);
      }
    }
    insert(index:number,row:T){
      this._array.splice(index,0,row);
      mb.Array.forEach(this._views,function(view:any){
        view.insert(index,row);
      });
      this._reload_size_();
    }
    removeAt(index:number){
      /*更常识的使用方法*/
      var row=this.get(index);
      this._array.splice(index,1);
      mb.Array.forEach(this._views,function(view:any){
        view.remove(index);
      });
      this._reload_size_();
      return row;
    }
    remove(row:T){
      /*更常识的使用方法*/
      var index=this.indexOf(row);
      if(index>-1){
        return this.removeAt(index);
      }
    }
    move(row:T,target_row:T){
      /*
      常识的移动方式，向前手动则向前，向后移动则向后
      如5中第3个，可移动1,2,4,5。分别是其它几个的序号而已
      */
      var target_index=this.indexOf(target_row);
      if(target_index>-1){
        this.moveTo(row,target_index);
      }
    }
    moveTo(row:T,target_index:number){
      var index=this.indexOf(row);
      if(index>-1){
        this._array.splice(index,1);
        this._array.splice(target_index,0,row);
        mb.Array.forEach(this._views,function(view:any){
          view.move(index,target_index);
        });
      }
    }
    /*多控件用array和model，单控件用包装*/
    moveToFirst(row:T) {
      this.moveTo(row,0);
    }
    moveToLast(row:T){
      this.moveTo(row,this.size()-1);
    }
    get(index:number){
      return this._array[index];
    }
    shift(){
      return this.removeAt(0);
    }
    unshift(row:T){
      return this.insert(0,row)
    }
    pop(){
      return this.removeAt(this.size()-1);
    }
    push(row:T){
      return this.insert(this.size(),row);
    }
    clear(){
      while(this.size()>0){
        this.pop();
      }
    }
    reset(array?:T[]){
      this.clear();
      let that=this;
      mb.Array.forEach(array||[],function(row){
        that.push(row);
     });
    }
    forEach(fun:(row:T,i:number)=>void){
      for(var i=0;i<this.size();i++){
        fun(this.get(i),i);
      }
    }
    map(fun:<V>(row:T,i:number)=>V){
      var ret=[];
      for(var i=0;i<this.size();i++){
        ret[i]=fun(this.get(i),i);
      }
      return ret;
    }
    reduce<V>(fun:(init:V,row:T,i:number)=>V,init:V){
      for(var i=0;i<this.size();i++){
        init=fun(init,this.get(i),i);
      }
      return init;
    }
    filter(fun:(row:T,i:number)=>boolean){
      var ret=[];
      for(var i=0;i<this.size();i++){
        var row=this.get(i);
        if(fun(row,i)){
          ret.push(row);
        }
      }
      return ret;
    }
    find_index(fun:(row:T,i:number)=>boolean){
      var ret=-1;
      for(var i=0;i<this.size() && ret==-1;i++){
        if(fun(this.get(i),i)){
          ret=i;
        }
      }
      return ret;
    }
    indexOf(row:T,fun?:(row:T,i:number)=>boolean){
      const func=fun||function(c){
         return c==row;
       };
      return this.find_index(func);
    }
    find_row(fun:(row:T,i:number)=>boolean){
      var index=this.find_index(fun);
      if(index>-1){
        return this.get(index);
      }
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