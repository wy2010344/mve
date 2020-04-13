import { BParam } from "./arraymodel"
import { mve } from "../mve/util"
import { VirtualChildParam } from "../mve/virtualTreeChildren"



export abstract class BAbsView{
	abstract getElement():HTMLElement
	setBackground(c:string){
		this.getElement().style.background=c
	}
	private x:number
	private y:number
	private w:number
	private h:number
	kSetX(x:number){
		this.x=x
		this.getElement().style.left=x+"px"
	}
	kSetY(y:number){
		this.y=y
		this.getElement().style.top=y+"px"
	}
	kSetW(w:number){
		this.w=w
		this.getElement().style.width=w+"px"
	}
	kSetH(h:number){
		this.h=h
		this.getElement().style.height=h+"px"
	}

	//便利的方法，感觉都不会用
	kSetCenterX(x:number){
		this.kSetX(x - (this.w / 2))
	}
	kSetCenterY(y:number){
		this.kSetY(y - (this.h / 2))
	}

	protected getInnerElement(){
		return this.getElement()
	}
	private children:BAbsView[]=[]
	insert(index:number,view:BAbsView){
		if(-1 < index && index < (this.children.length + 1)){
			if(index<this.children.length){
				this.getInnerElement().insertBefore(view.getElement(),this.children[index].getElement())
			}else{
				this.getInnerElement().appendChild(view.getElement())
			}
			this.children.splice(index,0,view)
		}else{
			mb.log(`插入位置不正确，全长${this.children.length},位置${index}`)
		}
	}
	indexOf(view:BAbsView){
		return this.children.indexOf(view)
	}
	removeAt(index:number){
		let view=this.children.splice(index,1)[0]
		if(view){
			this.getInnerElement().removeChild(view.getElement())
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
export class BLable extends BAbsView{
	private element:HTMLDivElement
	getElement(){return this.element}
	constructor(){
		super()
		this.element=document.createElement("div")
		this.element.style.position="absolute"
		this.element.style.textAlign="center"
	}
	kSetH(h:number){
		this.element.style.lineHeight=h+"px"
		super.kSetH(h)
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
		this.element.style.cursor="pointer"
		this.element.style.textAlign="center"
	}
	setText(txt:string){
		//sizeToFit一体了
		this.element.innerText=txt
	}
	kSetH(h:number){
		this.element.style.lineHeight=h+"px"
		super.kSetH(h)
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
	private element:HTMLDivElement
	getElement(){return this.element}
	constructor(){
		super()
		this.element=document.createElement("div")
		this.element.style.position="absolute"
	}
}




export class BListItem{
	view=new BView()
	height=mve.valueOf(0)
}
export class BList{
	view=new BView()
	private children:BListItem[]=[]
	private size=mve.valueOf(0)
	private height=mve.valueOf(0)
	split=mve.valueOf(0)
	constructor(me:BParam){
		const that=this
		//高度监视
		me.WatchAfter<number>(function(){
			const size=that.size()
			const split=that.split()
			let h=0
			for(let i=0;i<that.size();i++){
				const child=that.children[i]
				child.view.kSetY(h)
				const ch=child.height()
				child.view.kSetH(ch)
				h = h + split + ch
			}
			if(size>0){
				return h-split
			}else{
				return h
			}
		},function(h){
			that.view.kSetH(h)
			that.height(h)
		})
		//宽度变化
		me.Watch(function(){
			const w =that.width()
			that.view.kSetW(w)
			const size=that.size()
			for(let i=0;i<size;i++){
				that.children[i].view.kSetW(w)
			}
		})
	}
	width=mve.valueOf(0)
	getHeight(){
		return this.height()
	}
	private reloadSize(){
		this.size(this.children.length)
	}
	insertBefore(e:BListItem,old:BListItem){
		const index=this.children.indexOf(old)
		if(index > -1){
			this.view.insert(index,e.view)
			this.children.splice(index,0,e)
			this.reloadSize()
		}else{
			mb.log("insert失败");
		}
	}
	append(e:BListItem){
		this.view.push(e.view)
		this.children.push(e)
		this.reloadSize()
	}
	remove(e:BListItem){
		const index=this.children.indexOf(e)
		if(index > -1){
			this.view.removeAt(index)
			this.children.splice(index,1)
			this.reloadSize()
		}else{
			mb.log("remove失败")
		}
	}
}

export class BListVirtualParam implements VirtualChildParam<BListItem>{
	constructor(
		private pel:BList
	){}
	remove(e: BListItem): void {
		this.pel.remove(e)
	}
	append(e: BListItem, isMove?: boolean): void {
		this.pel.append(e)
	}
	insertBefore(e: BListItem, old: BListItem, isMove?: boolean): void {
		this.pel.insertBefore(e,old)
	}
}