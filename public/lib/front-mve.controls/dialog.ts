import { JOChildren } from "../mve/childrenBuilder";
import { parseHTML, PNJO } from "../mve-DOM/index"
import { mve, orDestroy, orInit } from "../mve/util";


/**
 * 一个始终居中的窗口，自定义尺寸
 * @param children 
 */
function buildDialogContent(children:JOChildren<PNJO,Node>):PNJO {
	return {
		type:"div",
		style:{
			width:"100%",
			height:"100%",
			position:"fixed",
			top:"0px",
			left:"0px"
		},
		children:[
			{
				type:"div",
				style:{
					width:"100%",
					height:"100%",
					background:"black",
					opacity:"0.1",
					position:"absolute",
					top:"0px",
					left:"0px",
				}
			},
			{
				type:"table",
				style:{
					width:"100%",
					height:"100%",
					"text-align":"center",
					position:"relative"
				},
				children:[
					{
						type:"tbody",
						children:[
							{
								type:"tr",
								children:[
									{
										type:"td",
										children:children
									}
								]
							}
						]
					}
				]
			}
		]
	}
}

/**
 * 只有展示与隐藏
 * @param fun 
 */
export function buildDialogN1(fun:(me:mve.LifeModel,x:{
	hide():void;
})=>JOChildren<PNJO,Node>){
	const body=document.body;
  const show=mve.valueOf(false);
	const dialog=parseHTML.mve(function(me){
		const render_object=fun(me,{
			hide(){
				show(false);
			}
		});
		const element=buildDialogContent(render_object);
		element.style.display=function(){
			return show()?"":"none";
		};
		return element
	});
	var need_init=true;
	return {
		show(){
			if(need_init){
				body.appendChild(dialog.element);
				orInit(dialog)
				need_init=false;
			}
		  show(true);
		},
		hide(){
			show(false)
		},
		destroy(){
			if(!need_init){
				//已经初始化过了
				orDestroy(dialog)
				body.removeChild(dialog.element);
			}
		}
	}
};

/**
 * 全局居中窗口，一次性销毁关闭
 * @param fun 
 */
export function dialogShow(fun:(me:mve.LifeModel,close:()=>void)=>JOChildren<PNJO,Node>){
	const body=document.body;
	function close(){
		orDestroy(dialog)
		body.removeChild(dialog.element);
	}
	const dialog=parseHTML.mve(function(me){
		const render_object=fun(me,close)
		return buildDialogContent(render_object)
	});
	body.appendChild(dialog.element);
	orInit(dialog)
	return close
}