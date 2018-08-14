


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
	locsize [
		width height left top right bottom
	]
)

[
	Dep (quote Dep)
	
	Value (quote Value)

	Watcher (quote Watcher)

	Cache (quote Cache)

	locsize (quote locsize)

	Exp {
		(let (Parse) args)
		(let ret {
			(let (user-func) args mve this)
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
			(let k (cache []))
			`用户函数返回`
			(let user-result 
				(user-func 
					'k {
						(let (str) args)
						(kvs-find1st (k) str)
					}
					'Value Value
					'Watch Watch
					'Cache Cache
				)
			)
			`locsize部分`
			(let me  
				(reduce locsize 
					{
						(let (init str) args)
						(let fun (kvs-find1st user-result str))
						(kvs-extend 
							str 
							(if-run (exist? fun)
								{fun}
								{(Value 0)}
							) 
							init
						)
					}
				)
			)
			(let user-result* user-result)
			(let me
				(kvs-reduce user-result.out
					{
						(let (init v k) args)
						(kvs-extend v k init)
					}
					me
				)
			)
			(let element-result* 
				(Parse 
					user-result.element
					Watch
					k
					mve
				)
			)
			(let 
				user-init (default user-result.init empty-fun)
				element-init (default element-result.init empty-fun)
				user-destroy (default user-result.destroy empty-fun)
				element-destroy (default element-result.destroy empty-fun)
			)
			(kvs-extends 
				'getElement (quote element-result.getElement)
				'init {
					(element-init)
					(user-init)
				}
				'destroy {
					(user-destroy)
					(element-destroy)
					(forEach (watchPool) 
						{
							(let w* (first args))
							(w.disable)
						}
					)
				}
				me
			)
		})
		ret
	}
]
