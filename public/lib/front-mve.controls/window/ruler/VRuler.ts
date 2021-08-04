import { resizeForm } from "../form";
import { modelChildren } from "../../../mve/modelChildren";
import { mve } from "../../../mve/util";
import { DOMNode, svg } from "../../../mve-DOM/index";



export function vRuler(param:{
  bit:number
}){

  return resizeForm(function(me,p,rp){
    const model=mve.arrayModelOf<number>([])
    me.WatchAfter(
      function(){
        return rp.out.height() / param.bit
      },
      function(size){
        let i=model.size()
        while(i<size){
          model.push(i)
          i++
        }
      }
    )
    return {
      allow(){
        return true
      },
      element:svg({
        type:"svg",
        action:{
          mousedown:rp.move
        },
        style:{
          width(){
            return rp.out.width()+"px"
          },
          height(){
            return rp.out.height()+"px"
          }
        },
        children:[
          svg({
            type:"rect",
            style:{
              background:"gray",
              opacity:"0.1",
            },
            attr:{
              width(){
                return rp.out.width()
              },
              height(){
                return rp.out.height()
              }
            }
          }),
          modelChildren(model,function(me,row,index){
            let color="red"
            let diff = 20
            const lines:DOMNode[]=[]
            if(row % 10 == 0){
              color ="black"
              diff = diff + 20
              lines.push({
                type:"text",
                attr:{
                  y:row * param.bit,
                  x(){
                    return rp.out.width() / 2 + diff + 10
                  }
                },
                text:row+""
              })
              lines.push({
                type:"text",
                attr:{
                  y:row * param.bit,
                  x(){
                    return rp.out.width() / 2 - diff - 10
                  }
                },
                text:row+""
              })
            }else
            if(row % 5 == 0){
              color="orange"
              diff = diff + 10
            }
            lines.push({
              type:"line",
              style:{
                "stroke":color,
                "stroke-width":"1"
              },
              attr:{
                y1:row * param.bit,
                x1(){
                  return rp.out.width()/2 - diff
                },
                y2:row * param.bit,
                x2(){
                  return rp.out.width() / 2 + diff
                }
              }
            })
            return lines.map(svg)
          })
        ]
      })
    }
  })
}