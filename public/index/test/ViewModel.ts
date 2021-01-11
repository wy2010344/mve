import { mve } from "../../lib/mve/util"
import { parseHTML } from "../../lib/mve-DOM/index"
import { modelChildren } from "../../lib/mve/modelChildren"


interface Model{
  a:mve.Value<number>
}
export=parseHTML.mve(function(me) {
  const vs:Model[]=[]
  for(let i=0;i<20;i++){
    vs.push({
      a:mve.valueOf(i)
    })
  }
  const vm=mve.arrayModelOf(vs)
  return {
		type:"div",
		children:[
			{
				type:"div",
				text:"文字"
			},
			modelChildren(vm,function(me,row,index){
				return {
					type:"div",
					children:[
						{
							type:"div"
						},
						{
							type:"button",
							text:"删除"+row.a(),
							action:{
								click(){
									vm.remove(index())
								}
							}
						}
					]
				}
			})
		]
	}
})