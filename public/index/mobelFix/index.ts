import { MveUtil } from "../../lib/baseView/mveUtil"
import { mve } from "../../lib/mve/util"
import { SuperView, SubView } from "../../lib/baseView/arraymodel"
import { BView } from "../../lib/baseView/index"
import { sameWidth, sameHeight } from "../../lib/baseView/Layout"


const me=new MveUtil()

const width=mve.valueOf(0)
const height=mve.valueOf(0)

const element=document.createElement("div")
element.style.background="gray"
const navigation=new SuperView(new BView())
sameWidth(me,navigation)
sameHeight(me,navigation)
element.appendChild(navigation.view.getElement())
navigation.w(320)
navigation.h(640)
me.WatchAfter(width,function(w){
  navigation.x((w-navigation.w())/2)
})
me.WatchAfter(height,function(h){
  navigation.y((h-navigation.h())/2)
})
export={
  out:{
    width,height
  },
  element,
  init(){
    navigation.push(new 首页(navigation))
  },
  destroy(){
    navigation.destroy()
    me.destroy()
  }
}


class 首页 extends SubView{
  navigation:SuperView
  constructor(
    navigation:SuperView
  ){
      const view=new BView()
      super(view)
      this.navigation=navigation
      view.setBackground("yellow")
  }
}