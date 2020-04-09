

declare namespace cp{
  function go(repath:string,param?:{[key:string]:string|number|boolean}):void
  function replace(repath:string,param?:{[key:string]:string|number|boolean}):void
  function back(delta:number):void
  const search:string
  const query:{[key:string]:string}
}