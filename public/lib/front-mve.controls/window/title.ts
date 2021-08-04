
import { mve } from "../../mve/util"
import { dom, ItemValue, DOMNode } from "../../mve-DOM/index";
export function buildTitle(p:{
	height:number,
  move(e:Event):void,
  showClose():boolean,
  close_click?(e:Event):void;
  max:mve.Value<Boolean>;
  showMax():boolean;
  title?:ItemValue;
}){
  return dom({
    type:"div",
    style:{
      "background-image":"linear-gradient(180deg, #e6e6e6, #bab9ba)",
      cursor:"move",
			"border-radius":"5px 5px 0 0",
			"white-space":"nowrap",
			overflow:"hidden",
			"text-overflow":"ellipsis",
			height:p.height-1+"px",
			"line-height":p.height-1+"px",
			"border-bottom":"1px solid #696969"
    },
    action:{
      mousedown(e){
        p.move(e||window.event);
      }
    },
    children:[
      /*按钮部分*/                              
      dom({
        type:"img",
        attr:{
          src:pathOf("./close.png"),
          draggable:"false"
        },
        style:{
          width:"20px",
          height:"20px",
          cursor:"pointer",
          "vertical-align":"middle",
          backgroundColor:"white",
					"border-radius":"5px",
					"margin-left":"5px",
          display(){
            return p.showClose()?"":"none";
          }
        },
        action:{
          mousedown(e){
            mb.DOM.stopPropagation(e)
          },
          click:p.close_click
        }
      }),
      dom({
        type:"img",
        attr:{
          src(){
            return p.max()?pathOf("./normal.png"):pathOf("./max.png");
          },
          draggable:"false"
        },
        style:{
          width:"20px",
          height:"20px",
          cursor:"pointer",
          "vertical-align":"middle",
          backgroundColor:"white",
					"border-radius":"5px",
					"margin-left":"5px",
          display(){
            if(mb.DOM.isMobile()){
              return "none"
            }else{
              return p.showMax()?"":"none";
            }
          }
        },
        action:{
          mousedown(e){
            mb.DOM.stopPropagation(e)
          },
          click(){
            p.max(!p.max());
          }
        }
      }),
      /*标题部分*/
      dom({
        type:"div",
        style:{
					"font-weight":"bold",
					"font-size":"15px",
          "vertical-align":"middle",
          display:"inline",
          "margin":"0 5px",
          color:"#645d61"
        },
        text:p.title
      })
    ]
  })
}