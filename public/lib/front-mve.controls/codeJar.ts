import { PNJO } from "../mve-DOM/index"
import { mve } from "../mve/util"
/**
 * 固定参数，返回一个延时函数
 * @param cb 
 * @param wait 
 */
function debounce(cb:(...args:any[])=>void,wait:number){
	let timeOut=0
	return function(...args){
		clearTimeout(timeOut)
		timeOut=setTimeout(function(){
			cb(...args)
		},wait)
	}
}

function shouldRecord(e:KeyboardEvent){
	return !isUndo(e) 
			&& !isRedo(e) 
			&& e.key != "Meta"
			&& e.key != "Control"
			&& e.key != "Alt"
			&& !e.key.startsWith("Arrow")
}

/**
 * 深度遍历，先子后弟
 * @param editor 
 * @param visitor 
 */
function visit(editor:HTMLElement,visitor:(el:Node)=>(boolean|void)){
	const queue:Node[]=[]
	if(editor.firstChild){
		queue.push(editor.firstChild)
	}
	let el=queue.pop()
	while(el){
		if(visitor(el)){
			break
		}
		if(el.nextSibling){
			queue.push(el.nextSibling)
		}
		if(el.firstChild){
			queue.push(el.firstChild)
		}
		el=queue.pop()
	}
}
/**
 * 保存选中位置
 * anchor开始点，focus结束点
 */
function save(editor:HTMLElement){
	const s=window.getSelection()
	const pos:Position={start:0,end:0}
	visit(editor,function(el){
		if(el.nodeType!=Node.TEXT_NODE)return

		if(el==s.anchorNode){
			if(el==s.focusNode){
				pos.start += s.anchorOffset
				pos.end += s.focusOffset
				pos.dir = s.anchorOffset <= s.focusOffset ? "->" : "<-"
				return true
			}else{
				pos.start += s.anchorOffset
				if(pos.dir){
					return true
				}else{
					//选遇到开始点
					pos.dir="->"
				}
			}
		}else
		if(el==s.focusNode){
			pos.end += s.focusOffset
			if(pos.dir){
				return true
			}else{
				//先遇到结束点
				pos.dir="<-"
			}
		}

		if(el.nodeType == Node.TEXT_NODE){
			const len=(el.nodeValue||"").length
			if(pos.dir!="->"){
				pos.start += len
			}
			if(pos.dir!="<-"){
				pos.end += len
			}
		}
	})
	return pos
}

function restoreVerifyPos(pos:Position){
	let dir=pos.dir
	let start=pos.start
	let end=pos.end
	if(!dir){dir="->"}
	if(start<0){start=0}
	if(end<0){end=0}
	if(dir=="<-"){
		//交换开始与结束的位置，以便顺序遍历
		[start,end]=[end,start]
	}
	return [start,end,dir] as const
}
/**
 * 恢复选中位置
 * @param editor 
 * @param pos 
 */
function restore(editor:HTMLElement,pos:Position){
	const s=window.getSelection()
	let startNode:Node,startOffset=0
	let endNode:Node,endOffset=0
	const [start,end,dir]=restoreVerifyPos(pos)
	let current=0
	visit(editor,function(el){
		if(el.nodeType!=Node.TEXT_NODE)return
		const len=(el.nodeValue || "").length
		if(current + len >= start){
			if(!startNode){
				startNode=el
				startOffset=start-current
			}
			if(current + len >=end){
				endNode=el
				endOffset=end-current
				return true
			}
		}
		current+=len
	})
	if(!startNode){startNode=editor}
	if(!endNode){endNode=editor}
	if(dir=="<-"){
		[startNode,startOffset,endNode,endOffset]=[endNode,endOffset,startNode,startOffset]
	}
	s.setBaseAndExtent(startNode,startOffset,endNode,endOffset)
	return s
}
/**
 * 光标前的内容
 * @param editor 
 */
function beforeCursor(editor:HTMLElement){
	const s=window.getSelection()
	const r0=s.getRangeAt(0)
	const r=document.createRange()
	r.selectNodeContents(editor)
	r.setEnd(r0.startContainer,r0.startOffset)
	return r.toString()
}
/**
 * 光标后的内容
 * @param editor 
 */
function afterCursor(editor:HTMLElement){
	const s=window.getSelection()
	const r0=s.getRangeAt(0)
	const r=document.createRange()
	r.selectNodeContents(editor)
	r.setStart(r0.endContainer,r0.endOffset)
	return r.toString()
}

/**
 * 寻找字符串从某一点开始的空格
 * @param text 
 * @param from 
 */
function findPadding(text:string,from=0){
	let j=from
	while(j<text.length && /[ \t]/.test(text[j])){
		j++
	}
	return [text.substring(from,j),from,j] as const
}
/***
 * 换行或shift+tab时计算行前的空格与位置
 */
function findBeforePadding(beforeText:string){
	const i=beforeText.lastIndexOf('\n')+1
	return findPadding(beforeText,i)
}

function handleNewLine(
	editor:HTMLElement,
	indentOn:RegExp,
	tab:string,
	e:KeyboardEvent){
	const before=beforeCursor(editor)
	const after=afterCursor(editor)

	let [padding]=findBeforePadding(before)
	let newLinePadding = padding

	if(indentOn.test(before)){
		newLinePadding += tab
	}
	if(mb.browser.type=="FF" || newLinePadding.length>0){
		mb.DOM.preventDefault(e)
		insert('\n'+newLinePadding)
	}

	if(newLinePadding != padding && after[0] == "}"){
		const pos=save(editor)
		insert("\n"+padding)
		restore(editor,pos)
	}
}


/**
 * 补全括号等
 * @param editor 
 * @param e 
 */
function handleSelfClosingCharacters(
	editor:HTMLElement,
	e:KeyboardEvent,
	closePair:string[]
){
	const codeBefore=beforeCursor(editor)
	const codeAfter=afterCursor(editor)
	if(codeBefore.substr(codeBefore.length-1)!='\\'){
		const end=closePair.find(v=>v[1]==e.key)
		if(end && codeAfter.substr(0,1)==e.key){
			//后继已为某括号，不输入
			const pos=save(editor)
			mb.DOM.preventDefault(e)
			pos.start=++pos.end
			restore(editor,pos)
		}else{
			const begin=closePair.find(v=>v[0]==e.key)
			if(begin){
				//匹配某括号，不插入
				const pos=save(editor)
				mb.DOM.preventDefault(e)
				const text = e.key + begin[1]
				insert(text)
				pos.start=++pos.end
				restore(editor,pos)
			}
		}
	}
}

function deleteTab(editor:HTMLElement,start:number,padding:string,tab:string){
	const len=Math.min(tab.length,padding.length)
	if(len>0){
		restore(editor,{start,end:start+len}).deleteFromDocument()
	}
	return len
}
function handleTabCharacters(editor:HTMLElement,tab:string,e:KeyboardEvent){
	mb.DOM.preventDefault(e)
	const selection=window.getSelection()
	const selected=selection.toString()
	if(selected.length>0){
		//多行
		const pos=save(editor)
		const before=beforeCursor(editor)
		const [padding,start]=findBeforePadding(before)
		const inlines=selected.split('\n')
		if(e.shiftKey){
			//删除
			//第一行
			const firstLine=before.substr(start)+inlines[0]
			const [vpadding]=findPadding(firstLine)
			let di=deleteTab(editor,start,vpadding,tab)

			let nstart=start + firstLine.length + 1 - di
			//开始减去，如果选中包含减去，则不减
			const beginSub=Math.min(padding.length,tab.length)
			let endSub=di
			//中间行
			let i=1,end=inlines.length-1
			while(i<end){
				const [vpadding]=findPadding(inlines[i])
				const di=deleteTab(editor,nstart,vpadding,tab) 
				nstart = nstart + inlines[i].length + 1 - di
				endSub=endSub+di
				i++
			}
			if(end!=0){
				//最后一行
				const after=afterCursor(editor)
				const lastLine=inlines[end]+after.substr(0,after.indexOf('\n'))
				const [vpadding]=findPadding(lastLine)
				endSub=endSub+deleteTab(editor,nstart,vpadding,tab) 
			}
			if(pos.start<pos.end){
				pos.start-=beginSub
				pos.end-=endSub
			}else{
				pos.end-=beginSub
				pos.start-=endSub
			}
			restore(editor,pos)
		}else{
			//插入
			//第一行
			restore(editor,{start,end:start})
			insert(tab)
			let nstart=before.length+inlines[0].length+tab.length+1
			//其它行
			let i=1
			while(i<inlines.length){
				restore(editor,{start:nstart,end:nstart})
				insert(tab)
				nstart=nstart+inlines[i].length+tab.length+1
				i++
			}
			if(pos.start<pos.end){
				pos.start = pos.start + tab.length
				pos.end = pos.end + (tab.length*inlines.length)
			}else{
				pos.start = pos.start + (tab.length*inlines.length)
				pos.end = pos.end + tab.length
			}
			restore(editor,pos)
		}
	}else{
		//单行
		if(e.shiftKey){
			const before=beforeCursor(editor)
			const [padding,start]=findBeforePadding(before)
			if(padding.length>0){
				const pos=save(editor)
				const len=deleteTab(editor,start,padding,tab)
				pos.start -= len
				pos.end -= len
				restore(editor,pos)
			}
		}else{
			insert(tab)
		}
	}
}
/**
 * 记录历史
 * @param editor 
 * @param history 
 * @param focus 
 * @param at 
 * @returns 返回at
 */
function recordHistory(
	editor:HTMLElement,
	history:HistoryRecord[],
	focus:boolean,
	at:number
){
	if(!focus)return at
	const html=editor.innerHTML
	const pos=save(editor)

	const lastRecord=history[at]

	if(lastRecord
	&& lastRecord.html==html
	&& lastRecord.pos.start == pos.start
	&& lastRecord.pos.end == pos.end)return at
	at++
	
	history[at]={html,pos}
	history.splice(at+1)
	
	const maxHistory=300
	if(at > maxHistory){
		at = maxHistory
		history.splice(0,1)
	}
	return at
}


function handlePaste(
	editor:HTMLElement,
	hightlight:(e:HTMLElement)=>void,
	e:ClipboardEvent
){
	mb.DOM.preventDefault(e)
	const text=((e as any).originalEvent || e).clipboardData.getData("text/plain") as string
	const pos=save(editor)
	insert(text)
	hightlight(editor)
	restore(editor,{
		start:pos.start+text.length,
		end:pos.start+text.length
	})
}

function isCtrl(e:KeyboardEvent){
	return e.metaKey || e.ctrlKey
}
function isUndo(e:KeyboardEvent){
	return isCtrl(e) && !e.shiftKey && e.key.toLocaleLowerCase()=='z'
}
function isRedo(e:KeyboardEvent){
	return isCtrl(e) && e.shiftKey && e.key.toLocaleLowerCase()=='z'
}


function insert(text:string){
	text=text
		.replace(/&/g,"&amp;")
		.replace(/</g,"&lt;")
		.replace(/>/g,"&gt;")
		.replace(/"/g,"&quot;")
		.replace(/'/g,"&#039;")
	document.execCommand("insertHTML",false,text)
}



interface HistoryRecord{
	html:string
	pos:Position
}

interface Position{
	start:number
	end:number
	dir?:"->"|"<-"
}

export interface CodeJar{
	getContent():string
}
const contentEditable=mb.browser.type=="FF"?"true":"plaintext-only"
export interface CodeJarOption{
	type?:string
	content:mve.TValue<string>
	/**内容改变时触发，包括设置内容|keyup|paste */
	highlight(e:HTMLElement):void
	id?(v:CodeJar):void
	callback?(content:string):string
	cls?:mve.MTValue<string>
	tab?:mve.TValue<string>
	indentOn?:mve.TValue<RegExp>
	spellcheck?:mve.TValue<boolean>
	noClosing?:mve.TValue<boolean>
	closePair?:mve.TValue<string[]>
	width?:mve.TValue<number>
	height?:mve.TValue<number>
	readonly?:mve.TValue<boolean>
}
export function codeJar(p:CodeJarOption):PNJO{
	p.tab=p.tab||"\t"
	p.indentOn=p.indentOn||/{$/
	p.closePair=p.closePair||["()","[]",'{}','""',"''"]
	const vm={
		tab:mve.valueOrCall(p.tab),
		indentOn:mve.valueOrCall(p.indentOn),
		spellcheck:mve.valueOrCall(p.spellcheck),
		noClosing:mve.valueOrCall(p.noClosing),
		closePair:mve.valueOrCall(p.closePair),
		content:mve.valueOrCall(p.content)
	}
	let editor:HTMLElement
	const debounceHighlight=debounce(function(){
		const pos=save(editor)
		p.highlight(editor)
		restore(editor,pos)
	},30)
	let recording=false
	const debounceRecordHistory=debounce(function(event:KeyboardEvent){
		if(shouldRecord(event)){
			at=recordHistory(editor,history,focus,at)
			recording=false
		}
	},300)
	const history:HistoryRecord[]=[]
	let at=-1
	let focus=false
	//代码之前的鼠标事件
	let prev:string

	const jar:CodeJar={
		getContent(){
			return editor.textContent || ""
		}
	}
	function orCallback(){
		if(p.callback){
			p.callback(jar.getContent())
		}
	}
	return {
		type:p.type||"div",
		id(v){
			editor=v
			if(p.id){
				p.id(jar)
			}
		},
		attr:{
			contentEditable:mb.Object.reDefine(p.readonly,function(r){
				if(typeof(r)=='function'){
					return function(){
						return r()?undefined:contentEditable
					}
				}else{
					return r?undefined:contentEditable
				}
			}),
			spellcheck:p.spellcheck
		},
		text:mve.delaySetAfter(vm.content,function(content,set) {
			if(content!=jar.getContent()){
				set(content)
				p.highlight(editor)
			}
		}),
		cls:p.cls,
		style:{
			outline:"none",
			"overflow-wrap":"break-word",
			"overflow-y":"auto",
			resize:p.height?"none":"vertical",
			"white-space":"pre-wrap",
			width:mb.Object.reDefine(p.width,function(w){
				if(typeof(w)=='function'){
					return function(){
						return w()+"px"
					}
				}else{
					return w+"px"
				}
			}),
			height:mb.Object.reDefine(p.height,function(height){
				if(typeof(height)=='function'){
					return function(){
						return height()+"px"
					}
				}else{
					return height+"px"
				}
			})
		},
		action:{
			keydown(e:KeyboardEvent){
				if(e.defaultPrevented)return
				prev=jar.getContent()
				if(e.key=="Enter"){
					//换行
					handleNewLine(editor,vm.indentOn(),vm.tab(),e)
				}else
				if(e.key=="Tab"){
					//缩进与反缩进
					handleTabCharacters(editor,vm.tab(),e)
				}else
				if(isUndo(e)){
					//撤销
					mb.DOM.preventDefault(e)
					at--
					const record=history[at]
					if(record){
						editor.innerHTML=record.html
						//会对history的record产生副作用
						restore(editor,record.pos)
					}
					if(at<0){at=0}
				}else
				if(isRedo(e)){
					//重做
					mb.DOM.preventDefault(e)
					at++
					const record=history[at]
					if(record){
						editor.innerHTML=record.html
						//会对history的record产生副作用
						restore(editor,record.pos)
					}
					if(at>=history.length){at--}
				}else
				if(!p.noClosing){
					//补全括号
					handleSelfClosingCharacters(editor,e,vm.closePair())
				}
				if(shouldRecord(e) && !recording){
					at=recordHistory(editor,history,focus,at)
					recording=true
				}
			},
			keyup(e:KeyboardEvent){
				if(e.defaultPrevented)return
				if(e.isComposing)return

				if(prev != jar.getContent()){
					debounceHighlight()
				}
				debounceRecordHistory(e)
				orCallback()
			},
			focus(e){
				focus=true
			},
			blur(e){
				focus=false
			},
			paste(e){
				at=recordHistory(editor,history,focus,at)
				handlePaste(editor,p.highlight,e)
				at=recordHistory(editor,history,focus,at)
				orCallback()
			}
		}
	}
}