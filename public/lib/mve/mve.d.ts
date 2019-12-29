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

  interface WatchParam<B,A>{
    before?():B;
    exp(v: B):A;
    after?(v: A):void;
  }
  class TArrayModel<T>{
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
  type RenderSelfFun<E>=()=>(((me:Inner)=>ViewItem<E>) | E)
  interface RenderSelf<E>{
    render:RenderSelfFun<E>;
    id?:string|((o:any)=>void);
  }
  /**单个节点的，带自render的*/
  type SViewItem<E>=ViewItem<E> | RenderSelf<E> ;

  /**repeat应该支持返回重复节点 */
  interface ArrayRepeat<T,E>{
    array():T[],
    repeat(me:Inner,row:()=>T,index:number):Outter<E>;
  }
  interface ModelRepeat<T,E>{
    model:TArrayModel<T>,
    repeat(me:Inner,row:T,index:()=>number):Outter<E>;
  }

  /**多节点带生命周期 */
  type ESWithLife<E>={
    init?():void;
    destroy?():void;
    elements:MViewItem<E>[]
  }
  /**多节点的render*/
  type RenderMultiFun<E>=()=>( ((me:Inner)=>ESWithLife<E>) | MViewItem<E>[] );
  interface RenderMulti<E>{
    multi:true,
    render:RenderMultiFun<E>
  }
  /**重复节点的*/
  type MViewItem<E>=ViewItem<E> | RenderMulti<E> | ArrayRepeat<any,E> | ModelRepeat<any,E> | ESWithLife<E>;
  /**
   * 生命周期相关
   */
  interface Inner{
    readonly k:{[key:string]:any};
    Value<T>(t: T):mve.Value<T>;
    ReadValue<T>(v:mve.Value<T>):(()=>T);
    Watch<B,A>(v: mve.WatchParam<B,A>):void;
    Cache<T>(v:(() => T)):(()=> T);
    ArrayModel<T>(array?:T[]):mve.TArrayModel<T>;
  }


  /***********逐渐不关注********************************************************************************* */
    /**
   * mve中内部函数返回
   * E是返回的元素类型
   */
  interface Outter<E> {
    out?:any;
    init?: () => void;
    destroy?: () => void;
    element:E;
  }
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