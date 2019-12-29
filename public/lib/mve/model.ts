

/**
 * 父节点和自替换
 */
export interface EModel{
  pel:any,
  replaceChild(pel,ole_el,new_el):void
}

/**
 * mve表达式本身
 */
export type MveFun=(fun:(me:mve.Inner)=>{
  init?():void;
  destroy?():void;
  out?:any,
  element:any
})=>(e:EModel)=>MveOuterModel;
/**
 * 生命周期
 */
export interface LifeModel{
  k:KModel,
  inits:EmptyFun[],
  destroys:EmptyFun[]
}
/**
 * Parse返回的节点
 */
export interface EWithLife{
  element:any,
  m:LifeModel
}
/**
 * mve生成的元素
 */
export interface MveOuterModel{
  element:any,
  out?:any,
  init():void;
  destroy():void;
}
/**
 * 重复的model
 */
export interface ChildViewModel{
  row:{
    index:mve.Value<number>;
    data:any
  },
  obj:MveOuterModel
}
/**
 * 重复的array
 */
export interface ChildViewArrayModel{
  row:{
    index:number,
    data:mve.Value<number>
  },
  obj:MveOuterModel
}
/**
 * child节点
 */
export interface ChildNodeModel{
  m:LifeModel,
  firstElement():any,
  getNextObject():ChildNodeModel|EWithLife,
  setNextObject(obj:ChildNodeModel|EWithLife):void;
}
/**
 * 与自己相关的
 * watch生命周期
 */
export interface XModel{
  watch(exp):void,
  bind(value,fun:(v)=>void):void,
  if_bind(value,fun:(v)=>void):void;
}
export type EmptyFun=()=>void;

export type KModel={[key:string]:any};

export type AppendChild=(pel,el,isMove?:boolean)=>void;

/**
 * 生成生命周期相关的
 */
export type GenerateMeType=()=>{
  me:mve.Inner,
  life:XModel,
  forEachRun(vs:EmptyFun[]):void;
  destroy():void
}
/**
 * 单个mve-Parse的类型
 */
export type ParseType=(
  mve:MveFun,
  x:XModel,
  e:EModel,
  json,
  m:LifeModel
)=>EWithLife
/**
 * 创建children的函数
 */
export type RealBuildChildrenType=(
  e:EModel,
  x:XModel,
  children,
  m:LifeModel,
  appendChild:AppendChild
)=>{
  m:LifeModel,
  firstChild:EWithLife|ChildNodeModel|null,
  firstElement():any;
}


export type MveParseChildrenType=(fun:(me:mve.Inner)=>mve.ESWithLife<any>)=>((e:EModel,realbeuildChildren:RealBuildChildrenType,keep:{appendChild:AppendChild})=>
{
  firstElement():void,
  firstChild:EWithLife|ChildNodeModel,
  init():void,
  destroy():void}
)