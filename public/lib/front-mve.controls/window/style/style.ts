import jsdom = require("../../../front-lib/jsdom");
import { mve } from "../../../mve/util";

var h=(new Date()).getHours();
var state=false;
if(7<h && h<20){
  //7~8点，白天
  state=true;
}
var oldel;
export function loadStyle(bool:boolean){
  var style=bool?"day":"night";
  /**
  感觉还是非常需要class这种css属性。
  如果全靠js，则需要写太多代码，而不是将影响集中。
  css用class过滤，是将结果集中。
  js用标识判断，是将原因集中（全局的状态）
  */
  var el=jsdom.parseElement({
    type:"link",
    attr:{
      rel:"stylesheet",
      type:"text/css",
      href:pathOf("./"+style+".css?v="+(new Date()))
    }
  });
  if(oldel){
    document.body.removeChild(oldel);
  }
  oldel=el;
  document.body.appendChild(el);
};
loadStyle(state);
interface GState extends mve.Value<boolean>{
  color():string
  "background-color"():string
}
export const gstate:GState=mve.valueOf(state) as GState;
gstate["color"]=function(){
  //前景色
  return gstate()?"black":"white";
};
gstate["background-color"]=function(){
  //后景色
  return gstate()?"white":"black";
};