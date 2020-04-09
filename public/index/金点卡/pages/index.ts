import { pageOf } from "../util/page";

export=pageOf(function(me){
  function buttonOf(text:string,click:()=>void){
    return {
      type:"button",
      text,
      action:{
        click
      }
    }
  }
  return {
    title:"链接分享页面",
    element:{
      type:"div",
      style:{
        height:"100%",
        background:"gray",
        display:"flex",
        "flex-direction":"column",
        "justify-content":"space-around",
        "align-items":"center"
      },
      children:[
        buttonOf("我的推广二维码",function(){
          cp.go("./我的推广二维码/index")
        })
      ]
    }
  }
})