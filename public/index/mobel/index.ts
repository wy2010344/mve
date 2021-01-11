import { mve } from "../../lib/mve/util";
import { BStackItem, BAbsView } from "../../lib/baseView/index";
import { BParamImpl, BParam } from "../../lib/baseView/index";
import { allBuilder } from "../../lib/baseView/mveFix/index";
import { modelChildren } from "../../lib/baseView/mve/modelChildren";
import { CChildType } from "../../lib/baseView/mve/childrenBuilder";
import { CStackItem } from "../../lib/baseView/mveFix/stack";


const me=new BParamImpl()

type StackModel=(
	me:BParam,
	i:()=>number,
	model:mve.ArrayModel<StackModel>
)=>CChildType<CStackItem,BStackItem>[]
const model=mve.arrayModelOf<StackModel>([])
const result=allBuilder.stack.view(me,{
	type:"stack",
	w:100,
	h(){
		return BAbsView.transH(100)
	},
	children:[
		modelChildren(model,function(me,row,i){
			return row(me,i,model)
		})
	]
})
const element=document.createElement("div")
element.append(result.element.getElement())
export={
	out:{
		width(w){
			BAbsView.screenW(w)
			result.element.rewidth()
		},
		height(h){
			BAbsView.screenH(h)
		}
	},
	element:element,
	init(){
		mb.log("初始化")
		model.push(function(me,index,model){
			return [
				{
					children:[
						{
							type:"view",
							w:20,
							h:30,
							background:"red"
						}
					]
				}
			]
		})
	},
	destroy(){
		result.destroy()
		me.destroy()
	}
}