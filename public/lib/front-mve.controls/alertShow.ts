
/**
 * 与之对应的是dialog模块，是全局顶级的，弹窗可相互
 */

import { dom, DOMNode } from "../mve-DOM/index"
import { EOChildren } from "../mve/childrenBuilder"
import { modelChildren } from "../mve/modelChildren"
import { mve } from "../mve/util"

export type VirtualPage=(
  me:mve.LifeModel,
  p:VirtualAlertShow,
  close:()=>void
)=>EOChildren<Node>

export interface VirtualAlertShow{
  width():number,
  height():number,
  alertShow(page:VirtualPage):void,
}
export function alertShow(p:{
  width():number,
  height():number,
  page:VirtualPage
}):EOChildren<Node>{
  const model=mve.arrayModelOf<VirtualPage>([])
  const ps:VirtualAlertShow={
    width:p.width,
    height:p.height,
    alertShow(page){
      model.push(page)
    }
  }
  ps.alertShow(p.page)
  function sameWidth(){
    return p.width()+"px"
  }
  function sameHeight(){
    return p.height()+"px"
  }
  return dom({
    type:"div",
    style:{
      position:"relative"
    },
    children:[
      modelChildren(model,function(me,row,index){
        const urs=row(me,ps,function(){
          model.remove(index())
        })
        return dom({
					type:"div",
					style:{
						position:"absolute",
						top:"0px",
						left:"0px",
						width:sameWidth,
						height:sameHeight
					},
					children:urs
				})
      })
    ]
  })
}


export function dialogOf(fun:(me:mve.LifeModel,p:VirtualAlertShow,close:()=>void)=>{
  init?():void,
  destroy?():void,
  opacity?:string,
  backClick?():void,
  content:EOChildren<Node>
}):VirtualPage{
  return function(me,p,close){
    const result=fun(me,p,close)
    const opacity=result.opacity || "0.2"
    return dom({
			type:"div",
			init:result.init,
			destroy:result.destroy,
			children:[
				//背景
				dom({
					type:"div",
					style:{
						position:"absolute",
						top:"0px",
						left:"0px",
						width:"100%",
						height:"100%",
						background:"gray",
						opacity
					}
				}),
				//前景
				dom({
					type:"div",
					style:{
						position:"absolute",
						top:"0px",
						left:"0px",
						width:"100%",
						height:"100%",
						display:"flex",
						"align-items":"center",
						"justify-content":"center"
					},
					action:{
						click:result.backClick
					},
					children:result.content
				})
			]
		})
  }
}


export function showWaitting(pv:{
  message:string,
  second?:number,
  complete?():void
}):VirtualPage{
  return dialogOf(function(me,p,close){
    return {
      init(){
        const second = pv.second || 1
        setTimeout(function(){
          close()
          if(pv.complete){
            pv.complete()
          }
        },second * 1000)
      },
      opacity:"0",
      content:dom({
        type:"label",
        style:{
          background:"gray",
          color:"white"
        },
        text:pv.message
      })
    }
  })
}