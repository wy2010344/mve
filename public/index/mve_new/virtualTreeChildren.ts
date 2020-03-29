



export type VirtualChildType<PEO,EO>= EO | VirtualChild<PEO,EO>

export interface VirtualChildParam<PEO,EO>{
  remove(pel:PEO,e:EO):void,
  append(pel:PEO,e:EO):void,
  insertBefore(pel:PEO,e:EO,old:EO):void
}
export class VirtualChild<PEO,EO>{
  private constructor(
    private param:VirtualChildParam<PEO,EO>,
    private pel:PEO,
    private parent?:VirtualChild<PEO,EO>
  ){}
  private children:VirtualChildType<PEO,EO>[]=[]

  static deepRun<PEO,EO>(view:VirtualChildType<PEO,EO>,fun:(view:EO)=>void){
    if(view instanceof VirtualChild){
      for(let i=0;i<view.children.length;i++){
        VirtualChild.deepRun(view.children[i],fun)
      }
    }else{
      fun(view)
    }
  }
  size(){
    return this.children.length  
  }
  get(index:number){
    return this.children[index]
  }
  firstChild(){
    return this.children[0]
  }
  lastChild(){
    return this.children[this.children.length-1]
  }

  /**自己的前一个节点 */
  private before?:VirtualChildType<PEO,EO>
  /**自己的后一个节点 */
  private after?:VirtualChildType<PEO,EO>
  remove(index:number){
    const view=this.children.splice(index,1)[0]
    if(view){
      const before=this.children[index-1]
      const after=this.children[index]
      if(before && before instanceof VirtualChild){
        before.after=after
      }
      if(after && after instanceof VirtualChild){
        after.before=before
      }
      const that=this
      VirtualChild.deepRun(view,function(e){
        that.param.remove(that.pel,e)
      })
    }else{
      mb.log(`删除${index}失败,总宽度仅为${this.size()}`)
    }
  }

  private realNextEO(view:VirtualChildType<PEO,EO>):EO|null{
    if(view instanceof VirtualChild){
      const childrenFirst=view.firstChild()
      if(childrenFirst){
        //寻找自己的子级节点
        return this.realNextEO(childrenFirst)
      }else{
        //自己的后继
        const after=view.after
        if(after){
          return this.realNextEO(after)
        }else{
          return this.realParentNext(view.parent)
        }
      }
    }else{
      return view
    }
  }
  private realParentNext(parent?:VirtualChild<PEO,EO>):EO|null{
    if(parent){
      const after=parent.after
      if(after){
        return this.realNextEO(after)
      }else{
        return this.realParentNext(parent.parent)
      }
    }else{
      return null
    }
  }
  insert(index:number,view:VirtualChildType<PEO,EO>){
    if(index>-1 && index<(this.children.length+1)){
      this.children.splice(index,0,view)
      const before=this.children[index-1]
      const after=this.children[index+1]
      if(view instanceof VirtualChild){
        view.parent=this
        view.param=this.param
        view.pel=this.pel
        
        view.before=before
        view.after=after
      }
      if(before && before instanceof VirtualChild){
        before.after=view
      }
      if(after && after instanceof VirtualChild){
        after.before=view
      }
      const that=this
      const realNextEL=after?that.realNextEO(after):that.realParentNext(that)
      VirtualChild.deepRun(view,function(e){
        if(realNextEL){
          that.param.insertBefore(that.pel,e,realNextEL)
        }else{
          that.param.append(that.pel,e)
        }
      })
    }else{
      mb.log(`插入${index}失败,总宽度仅为${this.size()}`)
    }
  }
  static newRootChild<PEO,EO>(param:VirtualChildParam<PEO,EO>,pel:PEO){
    return new VirtualChild(param,pel)
  }
  push(view:VirtualChildType<PEO,EO>){
    return this.insert(this.children.length,view)
  }
  newChildAt(index:number):VirtualChild<PEO,EO>{
    const child=new VirtualChild(this.param,this.pel,this)
    this.insert(index,child)
    return child
  }
  newChildAtLast(){
    return this.newChildAt(this.children.length)
  }
}