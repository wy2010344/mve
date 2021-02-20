import { PNJO } from "../../mve-DOM/index";
import { JOChildren } from "../../mve/childrenBuilder";
import { mve } from "../../mve/util";
import { tab } from "./index";


export function top_tab<T>(me:mve.LifeModel,p:{
	tabs:mve.ArrayModel<T>;
	current:mve.Value<T>;
	width:mve.GValue<number>;
	title:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>string;
	render:(me:mve.LifeModel,row:T,index:mve.GValue<number>)=>PNJO
}){
	return tab(me,{
		tabs:p.tabs,
		current:p.current,
		render:function(me,x){
			var on_hiden=function(){
				return p.tabs.size()>0?"":"none";
			};
			let contentSpan:HTMLSpanElement
			return {
				type:"div",
				children:[
					{
						type:"div",
						children:[
							{
								type:"button",
								text:"<",
								style:{
									display:on_hiden
								},
								action:{
									click:function(){
										var c=contentSpan;
										c.scrollLeft=c.scrollLeft-10;
									}
								}
							},
							{
								type:"span",
								id(v){
									contentSpan=v
								},
								style:{
									display:"inline-block",
									overflow:"hidden",
									"vertical-align":"middle",
									width:function(){
										if (p.tabs.size()>0) {
											return p.width()-60+"px";
										}
									}
								},
								action:{
									wheel:function(e:any){
										var c=contentSpan;
										c.scrollLeft=c.scrollLeft+e.wheelDelta;
									}
								},
								children:[
									{
										type:"span",
										style:{
											"white-space":"nowrap"
										},
										children:x.build_head_children(function(me,row,index){
											return {
												type:"div",
												style:{
													display:"inline-block",
													border:"1px solid gray",
													padding:"2px",
													margin:"1px",
													color:function(){
														return x.current()==row?"white":"black";
													},
													"background-color":function(){
														return x.current()==row?"green":"";
													},
													cursor:"pointer"
												},
												text:p.title(me,row,index)
											}
										})
									}
								]
							},
							{
								type:"button",
								text:">",
								style:{
									display:on_hiden
								},
								action:{
									click:function(){
										var c=contentSpan;
										c.scrollLeft=c.scrollLeft+10;
									}
								}
							}
						]
					},
					{
						type:"div",
						children:x.build_body_children(function(me,row,index){
							return p.render(me,row,index);
						})
					}
				]
			}
		}
	})
}