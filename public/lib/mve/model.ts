

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
  element:FakeE
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
  element:FakeE,
  m:LifeModel
}

export interface EWithLifeRemove extends EWithLife{
  remove():void
}
/**
 * mve生成的元素
 */
export interface MveOuterModel{
  element:FakeE,
  out?:any,
  init():void;
  destroy():void;
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

/**伪元素，避免any*/
export type FakeE={type:"fakeElement"};

export type AppendChild=(pel:FakeE,el:FakeE,isMove?:boolean)=>void;
export type InsertChildBefore=(pel:FakeE,el:FakeE,el_old:FakeE,isMove?:boolean)=>void;
/**
 * 生成生命周期相关的
 */
export type GenerateMeType=()=>{
  me:mve.OldInner,
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



export interface MveParseChildrenType{
  (fun:(me:mve.Inner) => mve.RepeatOutter<any>):(
    (
      e:EModel,
      realbeuildChildren:RealBuildChildrenType,
      keep:{appendChild:AppendChild}
    )=>MultiParseResultItem
  )
}

/**多节点 */
export type MultiParseResultItem={
  firstElement():void,
  views:(ChildNodeItem)[];
  init():void,
  destroy():void
}


/**
 * 重复的model
 */
export interface ChildViewModel{
  row:{
    index:mve.Value<number>;
    data:any
  },
  obj:MultiParseResultItem
}
/**
 * 重复的array
 */
export interface ChildViewArrayModel{
  row:{
    index:number,
    data:mve.Value<number>
  },
  obj:MultiParseResultItem
}

export type ChildNodeItem=ChildNodeModel|EWithLifeRemove

/** */
export type childrenRender=(
  child,
  e:EModel,
  x:XModel,
  m:LifeModel,
  p_appendChild:AppendChild,
  mx:{
    before?(pel:FakeE):void;
    after?(pel:FakeE):void;
    insertChildBefore:InsertChildBefore,
    realBuildChildren:RealBuildChildrenType,
    buildChildrenOf(e:EModel,repeat,getO,keep:{appendChild:AppendChild})
    parseObject(child,e:EModel,x:XModel,m:LifeModel):EWithLifeRemove
    appendChildFromSetObject(obj: ChildNodeItem,p_appendChild: AppendChild):AppendChild
  })=>ChildNodeModel
/**
 * child节点
 */
export interface ChildNodeModel{
  m:LifeModel,
  firstElement():FakeE|void,
  deepRun(fun:(e:EWithLifeRemove)=>void):void,
  getNextObject():ChildNodeItem,
  setNextObject(obj:ChildNodeItem):void;
}

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
  views:ChildNodeItem[];
  firstElement():any;
}

export type AppendChildFromSetObjectType=(obj: ChildNodeItem,
  p_appendChild: AppendChild)=>AppendChild