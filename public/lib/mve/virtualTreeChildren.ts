



export type VirtualChildType<EO>= EO | VirtualChild<EO>

export interface VirtualChildParam<EO>{
  remove(e:EO):void,
  append(e:EO,isMove?:boolean):void,
  insertBefore(e:EO,old:EO,isMove?:boolean):void
}
/**
 * 列表的抽象树，似乎对web的各种布局很有用，对苹果却不是很有用
 * 苹果缺少布局，总是自定义组件来布局。苹果总是一个绝对定位的UIView
 * 或者封装TableView或CollectionView。想要实现GUID。
 * TableView有cell复用，重新给cell组装数据。具体到以行数据为单位。但是视图观察全局模型呢？
 * ArrayModel不更新位置的记录，只是增删，没有视图复用。
 * model本身是自更新复用视图的，不需要显式的更新。
 * 比如要自己封装列表，最大的个性化，跟navigation/tab一样，是页面作为自定义模型。那么VirtaulChildren的意义何在呢？
 * VirtualChild最初是解决web默认布局中，重复控件尾随固定控件。
 * 而自封装列表，接受的是视图，而视图又是封装了模型的，从而达到这个效果。作为整体render的片段，或者model。原生视图里没有这样的灵活的模型控制。
 * 没有web布局的苹果环境，只有原始的view/scroll/button/label/input，要用mve去自定义布局。则原来需要VirtualTreeChild的地方，变成了某种mve的某种应用形式
 * 比如图片列表尾随一个添加窗口这种情形。在web可以使用布局解决。纯mve的模式是固定一个添加控件，封装一层insert总在前一位
 * 主要是ArrayModel没有内部的VirtaulTree。所以没有直观布局的模式。其实导航(Navigation也无直观布局)
 * iOS这种简单控件就不需要VirtaulTree，直接用原生视图，差别大吗？
 * 主要是控件的存在是否受多数据源的影响，是业务逻辑部分还是布局部分。if的情况。无默认布局所以用子view。virtualTree是封装固定位置
 * VirtualTree是为了应对默认布局
 * 以子View为单位。
 * 使用原生的appendChild。则如何转化代码？视图本身作为模型单位。
 */
export class VirtualChild<EO>{
  private constructor(
    private param:VirtualChildParam<EO>,
    private parent?:VirtualChild<EO>
  ){}
  private children:VirtualChildType<EO>[]=[]

  static deepRun<EO>(view:VirtualChildType<EO>,fun:(view:EO)=>void){
    if(view instanceof VirtualChild){
      for(let i=0;i<view.children.length;i++){
        VirtualChild.deepRun(view.children[i],fun)
      }
    }else{
      fun(view)
    }
  }
  /**自己的后一个节点 */
  private after?:VirtualChildType<EO>
  private pureRemove(index:number){
    const view=this.children.splice(index,1)[0]
    const before=this.children[index-1]
    const after=this.children[index]
    if(before && before instanceof VirtualChild){
      before.after=after
    }
    return view
  }
  remove(index:number){
    if(index>-1 && index<this.children.length){
      const view=this.pureRemove(index)
      const that=this
      VirtualChild.deepRun(view,function(e){
        that.param.remove(e)
      })
    }else{
      mb.log(`删除${index}失败,总宽度仅为${this.children.length}`)
    }
  }
  move(oldIndex:number,newIndex:number){
    if(oldIndex>-1 && oldIndex<this.children.length
    && newIndex>-1 && newIndex<this.children.length){
      const view=this.pureRemove(oldIndex)
      const after=this.pureInsert(newIndex,view)
      const realNextEL=this.nextEL(after)
      const that=this
      VirtualChild.deepRun(view,function(e){
        if(realNextEL){
          that.param.insertBefore(e,realNextEL,true)
        }else{
          that.param.append(e,true)
        }
      })
    }
  }
  private pureInsert(index:number,view:VirtualChildType<EO>){
    this.children.splice(index,0,view)
    const before=this.children[index-1]
    const after=this.children[index+1]
    if(view instanceof VirtualChild){
      view.parent=this
      view.param=this.param
      view.after=after
    }
    if(before && before instanceof VirtualChild){
      before.after=view
    }
    return after
  }
  private nextEL(after:VirtualChildType<EO>){
    if(after){
      return VirtualChild.realNextEO(after)
    }else{
      return VirtualChild.realParentNext(this)
    }
  }
  insert(index:number,view:VirtualChildType<EO>){
    if(index>-1 && index<(this.children.length+1)){
      const after=this.pureInsert(index,view)
      const realNextEL=this.nextEL(after)
      const that=this
      if(realNextEL){
        VirtualChild.deepRun(view,function(e){
          that.param.insertBefore(e,realNextEL) 
        })
      }else{
        VirtualChild.deepRun(view,function(e){
          that.param.append(e)
        })
      }
    }else{
      mb.log(`插入${index}失败,总宽度仅为${this.children.length}`)
    }
  }

  private static realNextEO<EO>(view:VirtualChildType<EO>):EO|null{
    if(view instanceof VirtualChild){
      const childrenFirst=view.children[0]
      if(childrenFirst){
        //寻找自己的子级节点
        return VirtualChild.realNextEO(childrenFirst)
      }else{
        //自己的后继
        const after=view.after
        if(after){
          return VirtualChild.realNextEO(after)
        }else{
          return VirtualChild.realParentNext(view.parent)
        }
      }
    }else{
      return view
    }
  }
  private static realParentNext<EO>(parent?:VirtualChild<EO>):EO|null{
    if(parent){
      const after=parent.after
      if(after){
        return VirtualChild.realNextEO(after)
      }else{
        return VirtualChild.realParentNext(parent.parent)
      }
    }else{
      return null
    }
  }
  static newRootChild<EO>(param:VirtualChildParam<EO>){
    return new VirtualChild(param)
  }
  push(view:VirtualChildType<EO>){
    return this.insert(this.children.length,view)
  }
  newChildAt(index:number):VirtualChild<EO>{
    const child=new VirtualChild(this.param,this)
    this.insert(index,child)
    return child
  }
  newChildAtLast(){
    return this.newChildAt(this.children.length)
  }
}