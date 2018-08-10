


(let Dep-target (cache null))

(let Dep ({
		(let uid (cache 0))
		{
			(let subs  (cache null))
			(uid (+ uid 1))
    		[
				id (uid)
    			depend {
    				(if-run (exist? (Dep-target))
							 {
							 		(subs
								 		(kvs-extend  
							 				(kvs-find1st (Dep-target) 'id) 
											(Dep-target)
							 				(subs) 
										)
									)
							 }
					)
    			}
    			notify {
    				(let old_subs (subs))
    				(subs [])
    				(kvs-forEach old_subs 
    					{
    						(let (v k) args)
    						(let update 
    							(kvs-find1st v 'update)
    						)
    						(update)
    					}
    				)
    			}
    		]
		}
	})
	`值节点`
	Value {
		(let dep* (Dep))
		(let v 
			(cache 
				(if (exist? args) (first args) null)
			)
		)
		{
			(let ags args)
			(if-run (empty? ags)
					{
						(dep.depend)
						(v)
					}
					{
						(if-run (exist? (Dep-target))
								{
									(log '计算期间不允许修改)
								}
								{
									(v (first ags))
									(dep.notify)
								}
						)
					}
			)
		}
	}
	Watcher ({
		(let uid (cache 0))
		{
			(let p* args)
			(let  
				before  (default p.before empty-fun) 
				after (default p.after empty-fun)
			)

			(let enable (cache true))
			(uid (+ (uid) 1))
			(let me (cache null))
			(let update 
				{
					(if-run (enable)
							{
								(let bo (before))
								(Dep-target (me))
								(let ao (p.exp bo))
								(Dep-target null)
								(after ao)
							}
					)
				}
			)
			(me [
				id (uid)
				update 'update
				disable {
					(enable false)
				}
			])
			(update)
			(me)
		}
	})

	Cache {
		(let dep* (Dep))
		(let (watch func) args)
		(let cache (cache null))
		(watch [
			exp {
				(cache (func ))
				(dep.notify)
			}
		])
		{
			(dep.depend)
			(cache)
		}
	}
)

[
	Dep (quote Dep)
	
	Value (quote Value)

	Watcher (quote Watcher)

	Cache (quote Cache)

	Exp {
		(let (Parse) args)
		(let ret {
			(let (func) args mve this)
			(let watchPool (cache null))
			(let Watch 
				{
					(let w (apply Watcher args))
					(watchPool 
						(extend w 
							(watchPool)
						)
					)
					w
				}
			)
			(let Cache 
				{
					(Cache Watch (first args))
				}
			)
			`用户函数返回`
			(let result* 
				(func 
					'k (cache null)
					'Value Value
					'Watch Watch
					'Cache Cache
				)
			)
			(let json* 
				(Parse 
					'element result.element
					'Value Value
					'Watch Watch
					'Cache Cache
					'mve mve
				)
			)
			(let 
				user-init (default result.init empty-fun)
				element-init (default json.init empty-fun)
				user-destroy (default result.destroy empty-fun)
				element-destroy (default json.destroy empty-fun)
			)
			[
				getElement (quote json.getElement)
				init {
					(element-init)
					(user-init)
				}
				destroy {
					(user-destroy)
					(element-destroy)
					(forEach (watchPool) 
						{
							(let w* (first args))
							(w.disable)
						}
					)
				}
			]
		})
		ret
	}
]
