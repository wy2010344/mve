import DOM = require("../mve-DOM/DOM")
import { DOMNode, reWriteAction } from "../mve-DOM/index"
import { mve } from "../mve/util"
/**
 * 固定参数，返回一个延时函数
 * @param cb 
 * @param wait 
 */
function debounce<TS extends any[]>(cb:(...ts:TS)=>void,wait:number){
	let timeOut=0
	return function(...ts:TS){
		clearTimeout(timeOut)
		timeOut=setTimeout(function(){
			cb(...ts)
		},wait)
	}
}

function shouldRecord(e:KeyboardEvent){
	return !isUndo(e) 
			&& !isRedo(e) 
			&& !DOM.keyCode.META(e)
			&& !DOM.keyCode.CONTROL(e)
			&& !DOM.keyCode.ALT(e)
			&& !DOM.keyCode.ARROWDOWN(e)
			&& !DOM.keyCode.ARROWLEFT(e) 
			&& !DOM.keyCode.ARROWUP(e) 
			&& !DOM.keyCode.ARROWDOWN(e)
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
 * 寻找字符串从某一点开始的空格或tab
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
/**
 * 新行。需要与上一行的tab对齐
 * @param editor 
 * @param indentOn 
 * @param tab 
 * @param e 
 */
function handleNewLine(
	editor:HTMLElement,
	indentOn:RegExp,
	tab:string,
	e:KeyboardEvent){
	const before=beforeCursor(editor)
	const after=afterCursor(editor)

	const [padding]=findBeforePadding(before)
	let newLinePadding = padding

	if(indentOn.test(before)){
		newLinePadding += tab
	}
	if(mb.browser.type=="FF" || newLinePadding.length>0){
		mb.DOM.preventDefault(e)
		insert('\n'+newLinePadding)
	}

	if(newLinePadding != padding && after[0] == "}"){
		const pos=mb.DOM.getSelectionRange(editor)
		insert("\n"+padding)
		mb.DOM.setSelectionRange(editor,pos)
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
			const pos=mb.DOM.getSelectionRange(editor)
			mb.DOM.preventDefault(e)
			pos.start=++pos.end
			mb.DOM.setSelectionRange(editor,pos)
		}else{
			const begin=closePair.find(v=>v[0]==e.key)
			if(begin){
				//匹配某括号，不插入
				const pos=mb.DOM.getSelectionRange(editor)
				mb.DOM.preventDefault(e)
				const text = e.key + begin[1]
				insert(text)
				pos.start=++pos.end
				mb.DOM.setSelectionRange(editor,pos)
			}
		}
	}
}
/**
 * 删除tab
 * @param editor 
 * @param start 
 * @param padding 
 * @param tab 
 * @returns 
 */
function deleteTab(editor:HTMLElement,start:number,padding:string,tab:string){
	const len=Math.min(tab.length,padding.length)
	if(len>0){
		mb.DOM.setSelectionRange(editor,{start,end:start+len}).deleteFromDocument()
	}
	return len
}
/**
 * 输入tab
 * @param editor 
 * @param tab 
 * @param e 
 */
function handleTabCharacters(editor:HTMLElement,tab:string,e:KeyboardEvent){
	mb.DOM.preventDefault(e)
	const selection=window.getSelection()
	const selected=selection.toString()
	if(selected.length>0){
		//多行
		const pos=mb.DOM.getSelectionRange(editor)
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
			mb.DOM.setSelectionRange(editor,pos)
		}else{
			//插入
			//第一行
			mb.DOM.setSelectionRange(editor,{start,end:start})
			insert(tab)
			let nstart=before.length+inlines[0].length+tab.length+1
			//其它行
			let i=1
			while(i<inlines.length){
				mb.DOM.setSelectionRange(editor,{start:nstart,end:nstart})
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
			mb.DOM.setSelectionRange(editor,pos)
		}
	}else{
		//单行
		if(e.shiftKey){
			const before=beforeCursor(editor)
			const [padding,start]=findBeforePadding(before)
			if(padding.length>0){
				const pos=mb.DOM.getSelectionRange(editor)
				const len=deleteTab(editor,start,padding,tab)
				pos.start -= len
				pos.end -= len
				mb.DOM.setSelectionRange(editor,pos)
			}
		}else{
			insert(tab)
		}
	}
}
////////////////////////////////历史记录///////////////////////////////////////////////
interface HistoryRecord{
	html:string
	pos:mb.DOM.Range
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
	const pos=mb.DOM.getSelectionRange(editor)

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

/**
 * 处理粘贴
 * @param editor 
 * @param hightlight 
 * @param e 
 */
function handlePaste(
	editor:HTMLElement,
	hightlight:(e:HTMLElement,pos:mb.DOM.Range)=>void,
	e:ClipboardEvent
){
	mb.DOM.preventDefault(e)
	const text=((e as any).originalEvent || e).clipboardData.getData("text/plain") as string
	const pos=mb.DOM.getSelectionRange(editor)
	insert(text)
	hightlight(editor,pos)
	mb.DOM.setSelectionRange(editor,{
		start:pos.start+text.length,
		end:pos.start+text.length
	})
}

function isCtrl(e:KeyboardEvent){
	return e.metaKey || e.ctrlKey
}
function isUndo(e:KeyboardEvent){
	return isCtrl(e) && !e.shiftKey && DOM.keyCode.Z(e)
}
function isRedo(e:KeyboardEvent){
	return isCtrl(e) && e.shiftKey && DOM.keyCode.Z(e)
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

/*
需要将cursor作为观察属性暴露出来，但设置cursor，是否会循环触发光标的定位？
内容改变也可作属性，只是内容改变，要设置新内容，是否触发观察？
绝对禁止从观察属性去循环改变属性本身，如内容变化通知改变内容。
*/
export interface CodeJar{
	getContent():string
	getSelection():mb.DOM.Range
	setSelection(v:mb.DOM.Range):void
}
export interface CodeJarOption{
	type?:string
	content?:mve.TValue<string>
	/**内容改变时触发，包括设置内容|keyup|paste */
	highlight(e:HTMLElement,pos:mb.DOM.Range):void
	id?(v:CodeJar):void
	callback?(content:string):string
	tab?:mve.TValue<string>
	indentOn?:mve.TValue<RegExp>
	spellcheck?:mve.TValue<boolean>
	noClosing?:mve.TValue<boolean>
	closePair?:mve.TValue<string[]>
	width?:mve.TValue<number>
	height?:mve.TValue<number>
	readonly?:mve.TValue<boolean>
	element?:DOMNode
}
export function codeJar(p:CodeJarOption):DOMNode{
	p.tab=p.tab||"\t"
	p.indentOn=p.indentOn||/{$/
	p.closePair=p.closePair||["()","[]",'{}','""',"''"]
	const vm={
		tab:mve.valueOrCall(p.tab),
		indentOn:mve.valueOrCall(p.indentOn),
		spellcheck:mve.valueOrCall(p.spellcheck),
		noClosing:mve.valueOrCall(p.noClosing),
		closePair:mve.valueOrCall(p.closePair),
		content:mve.valueOrCall(p.content||'')
	}
	let editor:HTMLElement
	const debounceHighlight=debounce(function(){
		const pos=mb.DOM.getSelectionRange(editor)
		p.highlight(editor,pos)
		mb.DOM.setSelectionRange(editor,pos)
	},30)
	let recording=false
	const debounceRecordHistory=debounce(function(event:KeyboardEvent){
		if(shouldRecord(event)){
			//记录keydown-up之间的改变。
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
		},
		getSelection(){
			return mb.DOM.getSelectionRange(editor)
		},
		setSelection(v){
			mb.DOM.setSelectionRange(editor,v)
		}
	}
	function orCallback(){
		if(p.callback){
			p.callback(jar.getContent())
		}
	}

	const element:DOMNode=p.element||{
		type:"pre"
	}
	element.action=element.action||{}
	const action=element.action

	reWriteAction(action,'keydown',function(vs){
		vs.push(function(e:KeyboardEvent){
			if(e.defaultPrevented)return
			prev=jar.getContent()
			if(DOM.keyCode.ENTER(e)){
				//换行
				handleNewLine(editor,vm.indentOn(),vm.tab(),e)
			}else
			if(DOM.keyCode.TAB(e)){
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
					mb.DOM.setSelectionRange(editor,record.pos)
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
					mb.DOM.setSelectionRange(editor,record.pos)
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
		})
		return vs
	})
	reWriteAction(action,'keyup',function(vs){
		vs.unshift(function(e:KeyboardEvent){
			if(e.defaultPrevented)return
			if(e.isComposing)return

			if(prev != jar.getContent()){
				debounceHighlight()
			}
			debounceRecordHistory(e)
			orCallback()
		})
		return vs
	})
	reWriteAction(action,'focus',function(vs){
		vs.push(function(e){
			focus=true
		})
		return vs
	})
	reWriteAction(action,'blur',function(vs){
		vs.push(function(e){
			focus=false
		})
		return vs
	})
	reWriteAction(action,'paste',function(vs){
		vs.push(function(e){
			at=recordHistory(editor,history,focus,at)
			handlePaste(editor,p.highlight,e)
			at=recordHistory(editor,history,focus,at)
			orCallback()
		})
		return vs
	})

	element.id=function(v){
		editor=v
		if(p.id){
			p.id(jar)
		}
	}

	element.attr=mb.Object.ember(element.attr||{},{
		contentEditable:mb.Object.reDefine(p.readonly,function(r){
			if(typeof(r)=='function'){
				return function(){
					return r()?undefined:mb.DOM.contentEditable.text
				}
			}else{
				return r?undefined:mb.DOM.contentEditable.text
			}
		}),
		spellcheck:p.spellcheck
	})
	element.text=mve.delaySetAfter(vm.content,function(content,set) {
		if(content!=jar.getContent()){
			set(content)
			p.highlight(editor,jar.getSelection())
		}
	})
	element.style=mb.Object.ember(element.style||{},{
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
	})
	return element
}