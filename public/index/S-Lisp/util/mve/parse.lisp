
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
	} build-locsize {
		(let (locsize json fun) args)
		(forEach locsize {
			(let 
				(str) args
				vf (kvs-find1st json str)
			)
			(if-run (exist? vf)
				(fun str vf)
			)
		})
	}
)
{
	(let (DOM build-children locsize) args)
	`对函数`
	(let Parse-fun 
		{
			(let (fun watch init destroy mve) args)
			(let change (cache []))
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
							`非第一次生成`
							(let obj* obj)
							(DOM 
								'replaceWith 
								(obj.getElement)
								(newObj.getElement)
							)
							(if-run (exist? obj.destroy) obj.destroy)
							(if-run (exist? newObj.init) newObj.init)
						}
						{
							`第一次生成`
							(if-run (exist? newObj.init)
								{
									(init 
										(extend newObj.init (init))
									)
								}
							)
						}
					)
				}
			)
			`销毁最后一个`
			(destroy
				(extend 
					{
						((default 
							(kvs-find1st (change) 'destroy)
							empty-fun
						))
					} 
					(destroy)
				)
			)
			change
		}
	)
	`对列表`
	(let Parse {
			(let (json watch k init destroy mve) args Parse this)
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
								`绑定id`
								(if-run (exist? j.id)
									{
										(k (kvs-extend j.id obj (k)))
									}
								)
								(let e (obj.getElement ))
								`绑定locsize`
								(build-locsize locsize json {
									(let (str vf) args
										 ef (default (obj str) empty-fun)
									)
									(bind watch vf {
										(let (v) args)
										(ef v)
										(DOM 'style e str (str-join ['v px]))
									})
								})
								e
							}
							{
								`原生组件`
								(let e 
									(DOM 
										'createElement 
										j.type
									)
								)
								`绑定id`
								(if-run (exist? j.id)
									{
										(k (kvs-extend j.id e (k)))
									}
								)
								`attr属性`
								(bindMap watch j.attr 
									{
										(let (k v) args)
										(DOM 'attr e k v)
									}
								)
								`style属性`
								(bindMap watch j.style
									{
										(let (k v) args)
										(DOM 'style e k v)
									}
								)
								`动作`
								(bindEvent j.action
									{
										(let (k v) args)
										(DOM 'action e k v)
									}
								)
								`内部字符`
								(if-bind watch j.text 
									{
										(let (v) args)
										(DOM 'text e v)
									}
								)
								`内部值`
								(if-bind watch j.value
									{
										(let (v) args)
										(DOM 'value e v)
									}
								)
								`innerHTML`
								(if-bind watch j.html
									{
										(let (v) args)
										(DOM 'html e v)
									}
								)
								`children`
								(if-run 
									(function? j.children)
									{
										`children是函数，即repeat`
										(build-children e j.children init destroy mve)
									}
									{
										`children是列表`
										(forEach j.children 
											{
												(let (child) args)
												(let ce (Parse child watch k init destroy mve))
												(DOM 'appendChild e ce)
											}
										)
									}
								)
								`绑定locsize`
								(build-locsize locsize json {
									(let (str vf) args)
									(bind watch vf {
										(let (v) args)
										(DOM 'style e str (str-join ['v px]))
									})
								})

								e
							}
					)
				}
				{
					(if-run (function? json)
						{
							`函数节点`
							(let change (Parse-fun json watch init destroy mve))
							((kvs-find1st (change) 'getElement))
						}
						{
							`值节点`
							(DOM 'createTextNode json)
						}
					)
				}
			)
		}
	)

	{
		(let 
			(json watch k mve) args
			inits (cache []) 
			destroys (cache []) 
			getElement  
				(if-run (function? json)
					{
						`function`
						(let change (Parse-fun json watch inits destroys mve))
						{
							((kvs-find1st (change) 'getElement))
						}
					}
					{
						(let el 
							(Parse json watch k inits destroys mve)
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
				(forEach (inits) 
					{
						(let (x) args)
						(x)
					}
				)
			}
			destroy {			
				(forEach (destroys)
					{
						(let (x) args)
						(x)
					}
				)
			}
		]
	}
}