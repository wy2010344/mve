({
	/*
	如果非html的drag

	mouseover/mouseout一组，先被触发，所有子组件
	mosueenter/mouseleave一组，只有父元素时会被触发
	

	
	*/
	success:function(p){


		return {
			mousedown:function(e){
				/*
				对应dragstart
				*/
			},
			mouseenter:function(e){
				/*
				对应dragenter
				*/
			},
			mouseleave:function(e){
				/*
				对应dragleave
				*/
			},
			up:function(e){
				/**
				鼠标释放事件，在document.mouseup，可能是成功，可能是取消
				*/
			},
			destroy:function(e){

			}
		}
	}
})