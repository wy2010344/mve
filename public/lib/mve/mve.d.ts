declare namespace mve{
  interface Value<T>{
    (): T;
    (t: T): void;
  }
  /** 泛型观察对象*/
  type TValue<T>=T|(()=>T);
  /** 要么是值，要么返回值的函数 */
  type StringValue=TValue<string>;
  /** 字符串Map*/
  type StringMap={ [key: string]: StringValue}

  type WatchParam<B,A>={
    before():B
    exp(v:B):A
    after(v:A):void
  }|{
    before():B
    exp(v:B):void
  }|{
    exp():A
    after(v:A):void
  }|{
    exp():void
  }
  interface TArrayModelView<T>{
    insert(index:number,row:T):void,
    remove(indeex:number):void,
    move(oldIndex:number,newIndex:number):void
  }
  /**需要内部的filter+sort，全浸染只展示部分。但与移动又是矛盾的。 */
  class TArrayModel<T>{
    addView(view:TArrayModelView<T>):void;
    removeView(view:TArrayModelView<T>):void;
    insert(index:number,row:T):void;
    removeAt(index:number):T;
    remove(row:T):T;
    move(row:T,target_row:T):void;
    moveTo(row:T,target_index:number):void;
    moveToFirst(row:T):void;
    moveToLast(row:T):void;
    get(index:number):T;
    shift():T;
    unshift(row:T):void;
    pop():T;
    push(row:T):void;
    clear():void;
    reset(array:T[]):void;
    forEach(fun:(t:T)=>void):void;
    map<V>(fun:(t:T)=>V):V[];
    reduce<V>(fun:(init:V,row:T,i:number)=>V):V;
    filter(fun:(t:T)=>boolean):T[];
    find_index(fun:(t:T)=>boolean):number;
    indexOf(row:T):number;
    find_row(fun:(t:T)=>boolean):T;
    size():number;
  }

  /**带单节点的生命周期 */
  type EWithLife<E>={
    init?():void;
    destroy?():void;
    element:E
  };
  /**单个节点，带生命周期的单个节点 */
  type ViewItem<E>=E | EWithLife<E> ;

  /**内部使用自变化*/
  type RenderSelfFun<E>=()=>(((me:Inner)=>ViewItem<E>) | ViewItem<E>)
  interface RenderSelf<E>{
    render:RenderSelfFun<E>;
    id?:string|((o:any)=>void);
  }
  /**单个节点的，带自render的*/
  type SViewItem<E>=ViewItem<E> | RenderSelf<E> ;

  /**多节点带生命周期 */
  type ESWithLife<E>={
    /**兼容性考虑 */
    init?():void;
    destroy?():void;
    element:MViewItem<E> | MViewItem<E>[]
  }
  /**多节点的render*/
  type RenderMultiFun<E>=()=>( ((me:Inner)=>RepeatOutter<E>) | RepeatOutter<E>  | void);
  interface RenderMulti<E>{
    multi:true,
    render:RenderMultiFun<E>
  }

  /**作为repeat的返回，multi-if的返回 */
  type RepeatOutter<E>=ESWithLife<E> | (MViewItem<E>[]) | MViewItem<E>;
  
  interface RepeatRender<T,E>{
    (child:T,e,x,m,p_appendChild,mx):{
      m,
      firstElement():E
      deepRun(fun:(e)=>void):void
      getNextObject():any
      setNextObject(e:any):void
    }
  }
  /**单纯作为重复项reset */
  interface ArrayRepeat<T,E>{
    type:RepeatRender<any,E>,
    array():T[],
    repeat(me:Inner,row:T,index:number):RepeatOutter<E>;
  }
  //兼容考虑，暂时先不加。
  interface ModelRepeat<T,E>{
    //type:RepeatRender<any,E>
    model:TArrayModel<T>,
    repeat(me:Inner,row:T,index:()=>number):RepeatOutter<E>;
  }
  /**@description */
  interface ArrayRepeat_old<T,E>{
    //type:RepeatRender<any,E>
    array():T[],
    repeat(me:Inner,row:()=>T,index:number):RepeatOutter<E>;
  }  
  /**重复节点的单元素*/
  type MViewItem<E>=ViewItem<E> 
    | RenderMulti<E> 
    | ArrayRepeat_old<any,E> 
    | ArrayRepeat<any,E> 
    | ModelRepeat<any,E> 
    | ESWithLife<E>;
  
  /**生命周期相关*/
  interface OldInner{
    readonly k:{[key:string]:any};
    /**@description */
    Value<T>(t: T):mve.Value<T>;
    /**@description */
    ReadValue<T>(v:mve.Value<T>):(()=>T);
    Watch<B,A>(v: mve.WatchParam<B,A>):void;
    Cache<T>(v:(() => T)):(()=> T);
    /**@description */
    ArrayModel<T>(array?:T[]):mve.TArrayModel<T>;
  }
  /*生命周期只需要Watch和Cache。*/
  interface Inner{
    Watch<B,A>(v: mve.WatchParam<B,A>):void;
    Cache<T>(v:(() => T)):(()=> T);
  }

  /***********逐渐不关注********************************************************************************* */
  /**
   * mve函数的返回类型
   */
  type Return=(x:{
    pel:any,
    replaceChild?:any
  })=>{
    out?:any;
    init: () => void;
    destroy: () => void;
    element: any;
  }
}