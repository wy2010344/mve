
export function buildArray(p:{
  destroy(view):void;
  build(row,index:number):number;
  appendChild(view)
  init(view)
}) {
  const views=[]

  return {
    firstElement(){
      const view=views[0]
      if(view){
        return view.obj.firstElement()
      }
    },
    views:views,
    destroy(){
      mb.Array.forEach(views,p.destroy)
      views.length=0
    },
    reset(array){
      for(let i=0;i<views.length;i++){
        p.destroy(views[i]);
      }
      views.length=0;
      for(let i=0;i<array.length;i++){
        const view=p.build(array[i],i);
        views.push(view)
        p.appendChild(view)
        p.init(view)
      }
    }
  }
}