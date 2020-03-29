
import { ifChildren } from "../../lib/mve/v2/ifChildren"
import { modelChildren } from "../../lib/mve/v2/modelChildren"
import { NJO, parseHTML } from "../../lib/mve-DOM/indexv2"

export=mve(function(me){
	let centerV:HTMLDivElement
	const div=mve.Value(1)

	function ifChildrenOf(flag:number,num:number){
		return ifChildren(function(){
			if(div()%num==0){
				return []
			}else{
				return [
					{
						type:"div",
						text(){
							return flag+"标签"+div()%num
						}
					}
				]
			}
		})
	}

	const model=mve.ArrayModel([1,2,3])
	return {
		init(){
		 const ch=parseHTML.children(me,centerV,[
			 {
				 type:"button",
				 style:{
					 background:"gray"
				 },
				 text(){
					 return "当前计数"+div()
				 },
				 action:{
					 click(){
						 div(div()+1)
						 const flag=div()%7
						 let x=model.size()%7
						 mb.log(flag,x<model.size(),x,model.size())
						 model.insert(x,flag)
						 /*
						 model.unshift(model.size()+1)
						 */
					 }
				 }
			 },
			 ifChildrenOf(1,2),
			 ifChildrenOf(2,5),
			 modelChildren(model,function(me,row,index){
				 return [
					 ifChildrenOf(131,3),
					 {
						 type:"div",
						 style:{
							background:"yellow"
						 },
						 text:row+""
					 },
					 ifChildrenOf(141,7),
				 ] as NJO[]
			 }),
			 ifChildrenOf(5,13)
		 ])
		 ch.init()
		},
		element:{
			type:"div",
			id(v){
				centerV=v
			}
		}
	}
})