
import { mve } from "../../mve/util"
import { ItemValue } from "../../mve-DOM/index";
export function buildTitle(p:{
  move(e:Event):void,
  showClose():boolean,
  close_click?(e:Event):void;
  max:mve.Value<Boolean>;
  showMax():boolean;
  title?:ItemValue;
}){
  return {
    type:"div",
    style:{
      background:"#beceeb",
      cursor:"move"
    },
    action:{
      mousedown(e){
        p.move(e||window.event);
      }
    },
    children:[
      /*按钮部分*/                              
      {
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
      },
      {
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
      },
      /*标题部分*/
      {
        type:"div",
        style:{
					"font-weight":"bold",
					"font-size":"15px",
          "vertical-align":"middle",
          display:"inline-block",
          "margin":"0 5px",
          color:"#120def"
        },
        text:p.title
      }
    ]
  };
}