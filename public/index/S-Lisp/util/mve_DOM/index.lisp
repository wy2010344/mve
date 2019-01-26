{
	(let 
		DOM (load './DOM.lisp)
		util  (load (lib-path 'mve/util.lisp))
		Parse (load (lib-path 'mve/parse.lisp))
		build-children (
			(load (lib-path 'mve/build-children.lisp))
			[
				Value 'util.Value
				Watcher 'util.Watcher
				key children
				appendChild 'DOM.appendChild
				removeChild 'DOM.removeChild
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
					(DOM.style el key 
						(if value 
							(str-join ['value px])
							""
						)
					)
				}
				replaceWith 'DOM.replaceWith
				createTextNode {
					(let (x o) args)
					[
						element (DOM.createTextNode (default o.json ""))
						k 'o.k
						inits 'o.inits
						destroys 'o.destroys
					]
				}
				buildElement {
					(let (x o) args)
					`原生组件`
					(let e  (DOM.createElement o.json.type o.json.NS))
					`children`
					(let obj (build-children e x o))
					[
						element 'e
						k 'obj.k
						inits 'obj.inits
						destroys 'obj.destroys
					]
				}
				makeUpElement {
					(let (e x json) args)
					`attr属性`
					(x.bindMap json.attr 
						{
							(let (k v) args)
							(DOM.attr e k v)
						}
					)
					`style属性`
					(x.bindMap json.style
						{
							(let (k v) args)
							(DOM.style e k v)
						}
					)
					`动作`
					(x.bindEvent json.event
						{
							(let (k v) args)
							(DOM.event e k v)
						}
					)
					`内部字符`
					(x.if-bind json.text 
						{
							(let (v) args)
							(DOM.text e v)
						}
					)
					`内部值`
					(x.if-bind json.value
						{
							(let (v) args)
							(DOM.value e v)
						}
					)
					`innerHTML`
					(x.if-bind json.html
						{
							(let (v) args)
							(DOM.html e v)
						}
					)
				}
			]
		)
	)
}