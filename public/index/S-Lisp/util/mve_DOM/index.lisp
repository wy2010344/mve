{
	(let 
		DOM (load './DOM.lisp)
		util  (load '../mve/util.lisp)
		Parse (load '../mve/parse.lisp)
		build-children (
			(load '../mve/build-children.lisp)
			[
				key children
				Value 'util.Value
				appendChild 'DOM.appendChild
				removeChild 'DOM.removeChild
				Watcher 'util.Watcher
			]
		)
		locsize [
			width height left top right bottom
		]
	)
	(util.Exp
		locsize
		DOM
		(Parse 
			locsize
			[
				locsize {
					(let (el key value) args)
					(DOM.style el key (str-join ['value px]))
				}
				replaceWith 'DOM.replaceWith
				createTextNode {
					(let (x) args)
					(list 
						(DOM.createTextNode x.o)
						x.inits
						x.destroys
					)
				}
				buildElement {
					(let (x) args)
					`原生组件`
					(let e  (DOM.createElement x.o.type))
					`attr属性`
					(x.bindMap x.o.attr 
						{
							(let (k v) args)
							(DOM.attr e k v)
						}
					)
					`style属性`
					(x.bindMap x.o.style
						{
							(let (k v) args)
							(DOM.style e k v)
						}
					)
					`动作`
					(x.bindEvent x.o.event
						{
							(let (k v) args)
							(DOM.event e k v)
						}
					)
					`内部字符`
					(x.if-bind x.o.text 
						{
							(let (v) args)
							(DOM.text e v)
						}
					)
					`内部值`
					(x.if-bind x.o.value
						{
							(let (v) args)
							(DOM.value e v)
						}
					)
					`innerHTML`
					(x.if-bind watch x.o.html
						{
							(let (v) args)
							(DOM.html e v)
						}
					)
					`children`
					(let (inits destroys) (build-children e x))
					(list 
						e
						inits
						destroys
					)
				}
			]
		)
	)
}