
export interface UndoRedo{
	/**撤销 */
	undo():void
	/**恢复 */
	redo():void
}

export class UndoRedoStack{
	private stack:UndoRedo[]=[]
	constructor(private max=400){}
	/**位置*/
	private flag=0
	pushAnDo(unredo:UndoRedo){
		if(this.flag < this.stack.length){
			this.stack.length=this.flag//去除后面的
		}
		this.stack.push(unredo)
		if(this.stack.length==this.max){
			this.stack.shift()
			this.flag--
		}
		unredo.redo()
		this.flag++
	}
	undo(){
		if(this.flag>0){
			this.flag--
			this.stack[this.flag].undo()
		}
	}
	redo(){
		if(this.flag<this.stack.length){
			this.stack[this.flag].redo()
			this.flag++
		}
	}
}
