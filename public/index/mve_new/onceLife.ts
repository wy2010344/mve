export function onceLife(p:{
	init():void,
	destroy():void
}){
	const self={
		isInit:false,
		isDestroy:false,
		init(){
			if(self.isInit){
				mb.log("禁止重复init")
			}else{
				self.isInit=true
				p.init()
			}
		},
		destroy(){
			if(self.isDestroy){
				mb.log("禁止重复destroy")
			}else{
				self.isDestroy=true
				if(self.isInit){
					p.destroy()
				}else{
					mb.log("未初始化故不销毁")
				}
			}
		}
	}
	return self
}