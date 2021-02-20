import { resizeForm } from "../form";
import { modelChildren } from "../../../mve/modelChildren";
import { mve } from "../../../mve/util";
import { PNJO } from "../../../mve-DOM/index";



export function hRuler(param:{
  bit:number
}){

  return resizeForm(function(me,p,rp){
    const model=mve.arrayModelOf<number>([])
    me.WatchAfter(function(){
        return rp.out.width() / param.bit
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
      element:{
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
          {
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
          },
          modelChildren(model,function(me,row,index){
            let color="red"
            let diff = 20
            const lines:PNJO[]=[]
            if(row % 10 == 0){
              color ="black"
              diff = diff + 20
              lines.push({
                type:"text",
                attr:{
                  x:row * param.bit,
                  y(){
                    return rp.out.height() / 2 + diff + 10
                  }
                },
                text:row+""
              })
              lines.push({
                type:"text",
                attr:{
                  x:row * param.bit,
                  y(){
                    return rp.out.height() / 2 - diff - 10
                  }
                },
                text:row+""
              })
            }else
            if(row % 5 == 0){
              color="orange"
              diff = diff + 10
            }
            lines.push( {
              type:"line",
              style:{
                "stroke":color,
                "stroke-width":"1"
              },
              attr:{
                x1:row * param.bit,
                y1(){
                  return rp.out.height()/2 - diff
                },
                x2:row * param.bit,
                y2(){
                  return rp.out.height() / 2 + diff
                }
              }
            })
            return lines
          })
        ]
      }
    }
  })
}