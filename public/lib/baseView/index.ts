


export abstract class BAbsView{
	abstract getElement():HTMLElement
	setBackground(c:string){
		this.getElement().style.background=c
	}
	setX(x:number){
		this.getElement().style.left=x+"px"
	}
	setY(y:number){
		this.getElement().style.top=y+"px"
	}
	setW(w:number){
		this.getElement().style.width=w+"px"
	}
	setH(h:number){
		this.getElement().style.height=h+"px"
	}
}
export class BLable extends BAbsView{
	private element:HTMLDivElement
	getElement(){return this.element}
	constructor(){
		super()
		this.element=document.createElement("div")
		this.element.style.position="absolute"
	}
	setText(txt:string){
		//sizeToFit一体了
		this.element.innerText=txt
	}
}
export class BButton extends BAbsView{
	private element:HTMLDivElement
	getElement(){return this.element}
	constructor(){
		super()
		this.element=document.createElement("div")
		this.element.style.position="absolute"
	}
	setText(txt:string){
		//sizeToFit一体了
		this.element.innerText=txt
	}
	setClick(click:()=>void){
		mb.DOM.addEvent(this.element,"click",click)
	}
}
export class BInput extends BAbsView{
	private element:HTMLInputElement
	getElement(){return this.element}
	constructor(){
		super()
		this.element=document.createElement("input")
		this.element.style.position="absolute"
	}
	getValue(){
		return this.element.value
	}
}
export class BView extends BAbsView{
	private children:BAbsView[]=[]
	private element:HTMLDivElement
	getElement(){return this.element}
	constructor(){
		super()
		this.element=document.createElement("div")
		this.element.style.position="absolute"
	}
	insert(index:number,view:BAbsView){
		if(-1 < index && index < (this.children.length + 1)){
			if(index<this.children.length){
				this.element.insertBefore(view.getElement(),this.children[index].getElement())
			}else{
				this.element.appendChild(view.getElement())
			}
			this.children.splice(index,0,view)
		}else{
			mb.log(`插入位置不正确，全长${this.children.length},位置${index}`)
		}
	}
	removeAt(index:number){
		let view=this.children.splice(index,1)[0]
		if(view){
			this.element.removeChild(view.getElement())
		}else{
			mb.log(`删除位置不正确，全长${this.children.length},位置${index}`)
		}
	}
	/////////////////
	push(view:BAbsView){
		this.insert(this.children.length,view)
	}
	unshift(view:BAbsView){
		this.insert(0,view)
	}
	pop(){
		this.removeAt(this.children.length-1)
	}
	shift(){
		this.removeAt(0)
	}
}

export class BScrollView extends BAbsView{
	private children:BAbsView[]=[]
	private element:HTMLDivElement
	private inElement:HTMLDivElement
	getElement(){return this.element}
	constructor(){
		super()
		this.inElement=document.createElement("div")
		this.inElement.style.position="absolute"
		this.element=document.createElement("div")
		this.element.style.position="absolute"
		this.element.style.overflow="auto"
		this.element.appendChild(this.inElement)
	}
	setIW(w:number){
		this.inElement.style.width=w+"px"
	}
	setIH(h:number){
		this.inElement.style.height=h+"px"
	}
	insert(index:number,view:BAbsView){
		if(-1 < index && index < this.children.length + 1){
			this.children.splice(index,0,view)
			if(index<this.children.length){
				this.element.insertBefore(view.getElement(),this.children[index].getElement())
			}else{
				this.element.appendChild(view.getElement())
			}
		}else{
			mb.log(`插入位置不正确，全长${this.children.length},位置${index}`)
		}
	}
	removeAt(index:number){
		let view=this.children.splice(index,1)[0]
		if(view){
			this.element.removeChild(view.getElement())
		}else{
			mb.log(`删除位置不正确，全长${this.children.length},位置${index}`)
		}
	}
	/////////////////
	push(view:BAbsView){
		this.insert(this.children.length,view)
	}
	unshift(view:BAbsView){
		this.insert(0,view)
	}
	pop(){
		this.removeAt(this.children.length-1)
	}
	shift(){
		this.removeAt(0)
	}
}