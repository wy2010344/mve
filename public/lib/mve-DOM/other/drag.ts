


var stopSelect=function(){
  document.body.style["user-select"]="none";
};
var canSelect=function(){
  document.body.style["user-select"]="";
};
var diff=function(isX:boolean,e,old_e){
  if(isX){
    return e.clientX-old_e.clientX;
  }else{
    return e.clientY-old_e.clientY;
  }
};

export interface Direction{
  l?:boolean,
  r?:boolean,
  t?:boolean,
  b?:boolean
}
type TEvent={
  type:"move",
  event:Event
}|{
  type:"resize",
  event:Event,
  dir:Direction
}|{
  type:""
}


/**
 * 只移动
 * @param p 
 */
export function dragMoveHelper(p:{
  border?:Node;
  allow?:()=>boolean;
  diffX?:(diff:number)=>void;
  diffY?:(diff:number)=>void;
  cancel?:()=>void
}){
  let laste;
  let move=false;
  const allow=p.allow||function(){return true};
  const m={
    move(e){
      if(allow()){
        if(move){
          e=e||window.Event;
          var diffX=e.clientX-laste.clientX;
          if(diffX!=0){
            if(p.diffX){
              p.diffX(diffX);
            }
          }
          var diffY=e.clientY-laste.clientY;
          if(diffY!=0){
            if(p.diffY){
              p.diffY(diffY);
            }
          }
          laste=e;
          mb.DOM.stopPropagation(e);
        }
      }
    },
    cancel(e){
      move=false;
      canSelect();
      if(p.cancel){
        p.cancel()
      }
    }
  }
  const border=p.border||document;
  return {
    move(e){
      stopSelect();
      laste=e||window.Event;
      move=true;
      mb.DOM.stopPropagation(e);
    },
    init:function(){
      mb.DOM.addEvent(border,"mousemove",m.move);
      mb.DOM.addEvent(border,"mouseup",m.cancel);
      mb.DOM.addEvent(border,"mouseleave",m.cancel);
    },
    destroy:function(){
      mb.DOM.removeEvent(border,"mousemove",m.move);
      mb.DOM.removeEvent(border,"mouseup",m.cancel);
      mb.DOM.removeEvent(border,"mouseleave",m.cancel);
    }
  }
}
/**
 * 主要是拖拽放大。拖动只是辅助。如果只有拖动，不如另写
 * @param p 
 */
export function dragResizeMoveHelper(p:{
  border?:Node;
  allow?:()=>boolean;
  left:MveValue<number>;
  top:MveValue<number>;
  width:MveValue<number>;
  height:MveValue<number>;
}){
  var event:TEvent={
    type:""
  };
  const allow=p.allow||function(){return true};
  var m={
    cancel:function(e){
      event.type="";
      canSelect();
    },
    move:function(e){
      if(allow()){
        if(event.type=="resize"){
          var old_e=event.event;
          e=e||window.event;
          event.event=e;
          var x=diff(true,e,old_e);
          var y=diff(false,e,old_e);
          if(x!=0){
            if(event.dir.l){
              p.left(p.left()+x);
              p.width(p.width()-x);
            }
            if(event.dir.r){
              var x=diff(true,e,old_e);
              p.width(p.width()+x);
            }
          }
          if(y!=0){
            if (event.dir.t){
              p.top(p.top()+y);
              p.height(p.height()-y);
            }
            if(event.dir.b){
              p.height(p.height()+y);
            }
          }
        }else
        if(event.type=="move"){
          var old_e=event.event;
          e=e||window.event;
          event.event=e;
          var x=diff(true,e,old_e);
          var y=diff(false,e,old_e);
          if(x!=0){
            p.left(p.left()+x);
          }
          if(y!=0){
            p.top(p.top()+y);
          }
        }
      }
    }
  };
  //最大边界，一般是document
  const border=p.border||document;
  return {
    resize(e:Event,dir:Direction){
      stopSelect();
      event={
        type:"resize",
        event:e,
        dir:dir
      }
    },
    move(e:Event){
      stopSelect();
      event={
        type:"move",
        event:e
      }
    },
    init:function(){
      mb.DOM.addEvent(border,"mousemove",m.move);
      mb.DOM.addEvent(border,"mouseup",m.cancel);
      mb.DOM.addEvent(border,"mouseleave",m.cancel);
    },
    destroy:function(){
      mb.DOM.removeEvent(border,"mousemove",m.move);
      mb.DOM.removeEvent(border,"mouseup",m.cancel);
      mb.DOM.removeEvent(border,"mouseleave",m.cancel);
    }
  };
}