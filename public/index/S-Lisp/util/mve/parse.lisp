
(let bind {
		(let (watch value f) args)
		(if-run (function? value)
				{
					(watch 
						'exp {
							(value)
						}
						'after {
							(f (first args))
						}
					)
				}
				{
					(f value)
				}
		)
	} bindKV {
		(let (watch key value f) args)
		(bind watch value {
				(f key 
					(first args)
				)
			}
		)
	} bindMap {
		(let (watch map f) args)
		(if-run (exist? map)
				{
					(kvs-forEach map 
						{
							(let (v k) args)
							(bindKV watch k v f)
						}
					)
				}
		)
	} bindEvent {
		(let (map f) args)
		(if-run (exist? map)
				{
					(kvs-forEach map 
						{
							(let (v k) args)
							(f k v)
						}
					)
				}
		)
	} if-bind {
		(let (watch value f) args)
		(if-run 
			(exist? value)
			{
				(bind watch value f)
			}
		)
	}
)
(let replaceWith 
	{
		(let (old-e new-e) args)
		(js-call 
			(js-attr old-e 'parentNode)
			'replaceChild
			(list new-e old-e)
		)
	}
)
(let Parse-fun 
	{
		(let (fun watch init destroy mve change) args)
		(watch 'exp fun 'after 
			{
				(let (element) args)
				(let newObj 
					(mve 
						{ 
							[ element 'element] 
						}
					)
				)
				(let obj (change))
				(change newObj)
				(let newObj* newObj)
				(if-run (exist? obj)
					{
						(let obj* obj)
						(replaceWith 
							(obj.getElement)
							(newObj.getElement)
						)
						(if-run (exist? obj.destroy) obj.destroy)
						(if-run (exist? newObj.init) newObj.init)
					}
					{
						(if-run (exist? newObj.init)
							{
								(init 
									(extend newObj.init (init))
								)
							}
						)
						(if-run (exist? newObj.destroy)
							{
								(destroy 
									(extend newObj.destroy (destroy))
								)
							}
						)
					}
				)
			}
		)
	}
)
(let Parse {
		(let (json watch init destroy mve) args Parse this)
		(let json (default json ""))
		(if-run (list? json)
			{
				`列表情况，对应js中字典`
				(let j* json)
				(if-run (function? j.type)
						{
							`自定义组件`
							(let obj* (j.type j.params))
							(if-run (exist? obj.init)
								{
									(init 
										(extend obj.init (init))
									)
								}
							)
							(if-run (exist? obj.destroy)
								{
									(destroy 
										(extend obj.destroy (destroy))
									)
								}
							)
							(obj.getElement )
						}
						{
							`原生组件`
							(let e 
								(js-call 'document 'createElement 
									(list j.type)
								)
							)
							`attr属性`
							(bindMap watch j.attr 
								{
									(let (k v) args)
									(js-call e 'setAttribute (list k v ))
								}
							)
							`style属性`
							(let style (js-attr e 'style))
							(bindMap watch j.style
								{
									(let (k v) args)
									(js-attr style k v)
								}
							)
							`动作`
							(bindEvent j.action
								{
									(let (k v) args)
									(js-call 'mb.DOM 'addEvent (list e k v))
								}
							)
							`内部字符`
							(if-bind watch j.text 
								{
									(let (v) args)
									(js-attr e 'innerText v)
								}
							)
							`内部值`
							(if-bind watch j.value
								{
									(let (v) args)
									(js-attr e 'value v)
								}
							)
							`innerHTML`
							(if-bind watch j.html
								{
									(let (v) args)
									(js-attr e 'innerHTML v)
								}
							)
							`children`
							(if-run 
								(function? j.children)
								{
									`children是函数，即repeat`
								}
								{
									`children是列表`
									(forEach j.children 
										{
											(let (child) args)
											(let ce (Parse child watch init destroy mve))
											(js-call e 'appendChild (list ce))
										}
									)
								}
							)
							e
						}
				)
			}
			{
				(if-run (function? json)
					{
						`function`
						(let change (cache []))
						(Parse-fun json watch init destroy mve change)
						(log (change))
						((kvs-find1st (change) 'getElement))
					}
					{
						`值节点`
						(js-call 'document 'createTextNode 
							(list json)
						)
					}
				)
			}
		)
	}
)

{
	(let me* args)
	(let 
		init (cache []) 
		destroy (cache []) 
	)
	(let getElement
		(if-run (function? me.element)
			{
				`function`
				(let c-el (cache []))
				(Parse-fun me.element me.Watch init destroy me.mve c-el)
				{
					((kvs-find1st (c-el) 'getElement))
				}
			}
			{
				(let el 
					(Parse me.element me.Watch init destroy me.mve)
				)
				{
					el
				}
			}
		)
	)
	[
		getElement 'getElement
		init {
			(forEach (init) 
				{
					(let (x) args)
					(x)
				}
			)
		}
		destroy {			
			(forEach (destroy)
				{
					(let (x) args)
					(x)
				}
			)
		}
	]
}