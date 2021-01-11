import { mve } from "../mve/util"
import { VirtualChildParam } from "../mve/virtualTreeChildren"


export interface BParam{
  Watch(exp:()=>void):void
  WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void):void
  WatchBefore<A>(before:()=>A,exp:(a:A)=>void):void
  WatchAfter<B>(exp:()=>B,after:(b:B)=>void):void
}
export class BParamImpl implements BParam{
  private pool:mve.Watcher[]=[]
  Watch(exp:()=>void){
    this.pool.push(mve.Watch(exp))
  }
  WatchExp<A,B>(before:()=>A,exp:(a:A)=>B,after:(b:B)=>void){
    this.pool.push(mve.WatchExp(before,exp,after))
  }
  WatchBefore<A>(before:()=>A,exp:(a:A)=>void){
    this.pool.push(mve.WatchBefore(before,exp))
  }
  WatchAfter<B>(exp:()=>B,after:(b:B)=>void){
    this.pool.push(mve.WatchAfter(exp,after))
  }
  destroy(){
    while(this.pool.length>0){
      this.pool.pop().disable()
    }
  }
}

export abstract class BAbsView{
	abstract getElement():HTMLElement
	setBackground(c:string){
		this.getElement().style.background=c
	}
	private x:number
	private y:number
	private w:number
	private h:number
	static screenW=mve.valueOf(window.screen.availWidth)
	static screenH=mve.valueOf(window.screen.availHeight)
	private percentOfW(x:number){
		return x * BAbsView.screenW() / 100
	}
	/**
	 * 依高度的百分比(100)，转成依宽度的百分比
	 * @param percentH 
	 */
	static transH(percentH:number){
	  return percentH * BAbsView.screenH()  / BAbsView.screenW()
	}
	rewidth(){
		this.kSetH(this.h)
		this.kSetW(this.w)
		this.kSetX(this.x)
		this.kSetY(this.y)
		for(let i=0;i<this.children.length;i++){
			this.children[i].rewidth()
		}
	}
	kSetX(x:number){
		this.x=x
		this.getElement().style.left=this.percentOfW(x)+"px"
	}
	kSetY(y:number){
		this.y=y
		this.getElement().style.top=this.percentOfW(y)+"px"
	}
	kSetW(w:number){
		this.w=w
		this.getElement().style.width=this.percentOfW(w)+"px"
	}
	kSetH(h:number){
		this.h=h
		this.getElement().style.height=this.percentOfW(h)+"px"
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

export class BScrollList{
	outView=new BView()
	view=new BView()
	private children:BListItem[]=[]
	private size=mve.valueOf(0)
	split=mve.valueOf(0)
	constructor(me:BParam){
		this.outView.push(this.view)
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
		})
		//宽度变化
		me.Watch(function(){
			const w =that.width()
			that.view.kSetW(w)
			that.outView.kSetW(w)
			const size=that.size()
			for(let i=0;i<size;i++){
				that.children[i].view.kSetW(w)
			}
		})
		me.Watch(function(){
			const h=that.height()
			that.outView.kSetH(h)
		})
	}
	height=mve.valueOf(0)
	width=mve.valueOf(0)
	getInnerHeight(){
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
export class BScrollListVirtualParam implements VirtualChildParam<BListItem>{
	constructor(
		private pel:BScrollList
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

export class BGridItem{
	view=new BView()
}
export class BGrid{
	constructor(me:BParam){
		const that=this
		//高度监视
		me.WatchAfter<number>(function(){
			const size=that.size()
			const cw=that.cellWidth()
			const ch=that.cellHeight()
			const cc=that.columnNum() > 0?that.columnNum():1
			
			let i=0
			var col=0
			var row=0
			while(i<size){
				const child=that.children[i]
				col = i % cc
				row = i % cc
				child.view.kSetX(col * cw)
				child.view.kSetY(col * ch)
				i = i + 1
			}
			return (row + 1) * ch
		},function(h){
			that.view.kSetH(h)
			that.height(h)
		})
		//宽度变化
		me.Watch(function(){
			const w =that.width()
			that.view.kSetW(w)
		})
		//子视图高度相同
		me.Watch(function(){
			const ch=that.cellHeight()
			const size=that.size()
			let i=0
			while(i<size){
				const child=that.children[i]
				child.view.kSetH(ch)
				i = i + 1
			}
		})
		//子视图宽度相同
		me.Watch(function(){
			const cw=that.cellWidth()
			const size=that.size()
			let i=0
			while(i<size){
				const child=that.children[i]
				child.view.kSetW(cw)
				i = i + 1
			}
		})
	}
	cellWidth=mve.valueOf(0)
	cellHeight=mve.valueOf(0)
	columnNum=mve.valueOf(1)
	private	width=mve.valueOf(0)
	getWidth(){
		return this.width()
	}
	private height=mve.valueOf(0)
	getHeight(){
		return this.height()
	}
	view=new BView()
	private children:BGridItem[]=[]
	private size=mve.valueOf(0)
	private reloadSize(){
		this.size(this.children.length)
	}
	insertBefore(e:BGridItem,old:BGridItem){
		const index=this.children.indexOf(old)
		if(index > -1){
			this.view.insert(index,e.view)
			this.children.splice(index,0,e)
			this.reloadSize()
		}else{
			mb.log("insert失败");
		}
	}
	append(e:BGridItem){
		this.view.push(e.view)
		this.children.push(e)
		this.reloadSize()
	}
	remove(e:BGridItem){
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

export class BGridVirtualParam implements VirtualChildParam<BGridItem>{
	constructor(
		private pel:BGrid
	){}
	remove(e: BGridItem): void {
		this.pel.remove(e)
	}
	append(e: BGridItem, isMove?: boolean): void {
		this.pel.append(e)
	}
	insertBefore(e: BGridItem, old: BGridItem, isMove?: boolean): void {
		this.pel.insertBefore(e,old)
	}
}

export class BStackItem{
	view=new BView()
}

export class BStack{
	constructor(me:BParam){
		const that=this
		me.Watch(function(){
			const w=that.width()
			that.view.kSetW(w)
			const size=that.size()
			let i = 0
			while(i<size){
				that.children[i].view.kSetW(w)
				i = i + 1
			}
		})
		me.Watch(function(){
			const h=that.height()
			that.view.kSetH(h)
			const size=that.size()
			let i = 0
			while(i<size){
				that.children[i].view.kSetH(h)
				i = i + 1
			}
		})
	}
	width=mve.valueOf(0)
	height=mve.valueOf(0)
	view=new BView()
	private children:BStackItem[]=[]
	private size=mve.valueOf(0)
	private reloadSize(){
		this.size(this.children.length)
	}
	insertBefore(e:BStackItem,old:BStackItem){
		const index=this.children.indexOf(old)
		if(index > -1){
			this.view.insert(index,e.view)
			this.children.splice(index,0,e)
			this.reloadSize()
		}else{
			mb.log("insert失败");
		}
	}
	append(e:BStackItem){
		this.view.push(e.view)
		this.children.push(e)
		this.reloadSize()
	}
	remove(e:BStackItem){
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

export class BStackVirtualParam implements VirtualChildParam<BStackItem>{
	constructor(
		private pel:BStack
	){}
	remove(e: BStackItem): void {
		this.pel.remove(e)
	}
	append(e: BStackItem, isMove?: boolean): void {
		this.pel.append(e)
	}
	insertBefore(e: BStackItem, old: BStackItem, isMove?: boolean): void {
		this.pel.insertBefore(e,old)
	}
}
