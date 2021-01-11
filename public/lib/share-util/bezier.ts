export interface Point{
  x:number
  y:number
}
export interface AnchorPoints{
  forEach(fun:(point:Point,index:number)=>void):void
  size():number
}
/**
 * 参考 
 * https://www.cnblogs.com/lxiang/p/4995255.html
 * @param anchorPoints 
 * @param amount 点数量
 */
export function createBezierPoints(anchorPoints:AnchorPoints,amount:number) {
  const points=[]
  for(let i=0;i < amount;i++){
    points.push(createPointBezier(anchorPoints,i / (amount - 1)))
  }
  return points
}
/**
 * 项数https://zhuanlan.zhihu.com/p/143141894
 * @param start 
 * @param end 
 */
function erxiangshi(start:number,end:number) {
  let cs = 1,bcs =1
  while(end > 0){
    cs *= start
    bcs *= end
    start --
    end --
  }
  return cs / bcs
}
/**
 * 计算贝塞尔点
 * @param anchorPoints 锚点
 * @param t 0~1
 */
export function createPointBezier(anchorPoints:AnchorPoints,t:number):Point{
  const length=anchorPoints.size()
  let x=0,y=0
  anchorPoints.forEach(function(point,i){
    const cn=erxiangshi(length-1,i)
    const val = Math.pow(1-t,length-1-i) * Math.pow(t,i)*cn
    x += (point.x * val)
    y += (point.y * val)
  })
  return {
    x,y
  }
}
