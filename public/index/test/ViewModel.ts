

interface Model{
  a:mve.Value<number>
}
export=mve(function(me) {
  const vs:Model[]=[]
  for(let i=0;i<20;i++){
    vs.push({
      a:mve.Value(i)
    })
  }
  const vm=mve.ArrayModel(vs)
  return {
    type:"div",
    children:[
      {
        type:"div",
        text:"文字"
      },
      mve.repeat(vm,function(me,row,index) {
        return {
          type:"div",
          children:[
            {
              type:"div"
            },
            {
              type:"button",
              text:"删除"+row.a(),
              action:{
                click(){
                  vm.removeAt(index())
                }
              }
            }
          ]
        }
      })
    ]
  }
})