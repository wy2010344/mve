

interface ScrollKeep{
	top:number;
	left:number;
	el:Element;
}
function findScroll(el:Element,store:ScrollKeep[]){
	if(el.scrollTop!=0 || el.scrollLeft!=0){
		const keep={
			el:el,
			top:el.scrollTop,
			left:el.scrollLeft
		};
		store.push(keep)
	}
	for(let i=0;i<el.children.length;i++){
		findScroll(el.children[i],store);
	}
}
function keepScroll(el:Element){
	const store:ScrollKeep[]=[];
	findScroll(el,store);
	return store;
}
function reverScroll(store:ScrollKeep[]){
	mb.Array.forEach(store,function(scrollKeep){
		scrollKeep.el.scrollTop=scrollKeep.top
		scrollKeep.el.scrollLeft=scrollKeep.left
	})
}

function notEqual(a:string,b){
	return a!=b || (typeof(b)!="string" && a!=b+"")
}

export={
	createElement(type:string){
		return document.createElement(type);
	},
	createElementNS(type,NS){
		return document.createElementNS(NS,type);
	},
	createTextNode(json){
		return document.createTextNode(json);
	},
	appendChild(el,child,isMove?:boolean){
		if(isMove){
			const o=keepScroll(child)
			el.appendChild(child);
			reverScroll(o);
		}else{
			el.appendChild(child);
		}
	},
	replaceWith(el,newEL){
		var pN=el.parentNode;
		if(pN){
			pN.replaceChild(newEL,el);
		}
	},
	insertChildBefore(pel,new_el,old_el,isMove?:boolean){
		if(isMove){
			const oo=keepScroll(old_el)
			const no=keepScroll(new_el);
			pel.insertBefore(new_el,old_el);
			reverScroll(oo)
			reverScroll(no)
		}else{
			pel.insertBefore(new_el,old_el);
		}
	},
	removeChild(el,child){
		el.removeChild(child);
	},
	empty(el){
		while(el.firstChild){
			el.removeChild(el.firstChild);
		}
	},
	attr(el,key,value){
		const attr=el.getAttribute(key)
		if(notEqual(attr,value)){
			if(value==undefined){
				el.removeAttribute(key);
			}else{
				el.setAttribute(key,value);
			}
		}
	},
	style(el,key,value){
		//IE下如果设置负值，会导致错误
		try{
			if(notEqual(el.style[key],value)){
				el.style[key]=value;
			}
		}catch(e){
			mb.log(e);
		}
	},
	prop(el,key,value){  
		if(notEqual(el[key],value)) {
			el[key]=value;
		}             
	},
	action(el,key,value){
		if(typeof(value)=="function"){
			mb.DOM.addEvent(el,key,value);
		}else{
			mb.DOM.addEvent(el,key,value.handler,value)
		}
	},
	text(el,value){
		if(notEqual(el.innerText,value)){
			el.innerText=value;
		}
	},
	content(el,value){
		if(notEqual(el.textContent,value)){
			el.textContent=value;
		}
	},
	value(el,value){
		if(notEqual(el.value,value)){
			el.value=value;
		}
	},
	html(el,value) {
		if(notEqual(el.innerHTML,value)){
			el.innerHTML=value;
		}
	}
}