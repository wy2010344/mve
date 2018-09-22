


(let Dep-target (cache []))

(let Dep ({
		(let uid (cache 0))
		{
			(let subs  (cache []))
			`subs中已经包含`
			(let contain {
				(let (target-id) (first args))
				(some (subs) 
					{
						(let (id) (first args))
						(= id target-id)
					}
				)
			})
			(uid (+ (uid) 1))
    		[
    			`depend`
    			{
    				(if-run (exist? (Dep-target))
						{
						 	(if-run (contain (Dep-target))
						 		{
						 			`一个watch包含两个观察节点时`
						 			`(log '已经包含了)`
						 		}
						 		{
						 			(subs 
						 				(extend 
						 					(Dep-target) 
						 					(subs)
						 				)
						 			)
						 		}
						 	)
						}
					)
    			}
    			`notify` 
    			{
    				(let old_subs (subs))
    				(subs [])
    				(forEach old_subs 
    					{
    						(let (id update) (first args))
    						`
    							调用每个Watcher的update
    							每个Watcher将Dep-Target设置成自己
    							Watcher计算期间，所有依赖的Value进行depend，每个Value将这个Watcher加入自己的通知链
    							本值节点通知期间，重新收集通知链。而其它值节点，可能不需要收集（已经存在）
    						`
    						(update)
    					}
    				)
    			}
    			`id`
    			(uid)
    		]
		}
	})
	`值节点`
	Value {
		(let (dep-depend dep-notify dep-id) (Dep))
		(let v (apply cache args))
		{
			(let xs args)
			(if-run (exist? xs)
				{
					(if-run (exist? (Dep-target))
						{
							(log '计算期间不允许修改)
						}
						{
							(v (first xs))
							(dep-notify)
						}
					)
				}
				{
					(dep-depend)
					(v)
				}
			)
		}
	}
	Watcher ({
		(let uid (cache 0))
		{
			(let (p-before p-exp p-after) args)
			(let  
				before  (default p-before empty-fun) 
				after (default p-after empty-fun)
			)

			(let enable (cache true))
			(uid (+ (uid) 1))
			(let id (uid))
			(let update 
				{
					(let update this)
					(if-run (enable)
						{
							(let bo (before))
							(Dep-target 
								(list id update)
							)
							(let ao (p-exp bo))
							(Dep-target [])
							(after ao)
						}
					)
				}
			)
			(update)
			(list
				id
				update
				{
					(enable false)
				}
			)
		}
	})

	Cache {
		(let (dep-depend dep-notify dep-id) (Dep))
		(let (watch func) args)
		(let cache (cache []))
		(watch [
			exp {
				(cache (func ))
				(dep-notify)
			}
		])
		{
			(dep-depend)
			(cache)
		}
	}
	locsize [
		width height left top right bottom
	]
)

[
	Value (quote Value)

	Watcher (quote Watcher)

	Cache (quote Cache)

	locsize (quote locsize)

	Exp {
		(let (Parse) args)
		(let ret {
			(let (user-func) args mve this)
			(let watchPool (cache []))
			(let Watch 
				{
					(let kvf (kvs-match args))
					(let w 
						(Watcher 
							(kvf 'before)
							(kvf 'exp)
							(kvf 'after)
						)
					)
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
					Value
					`k`
					{
						(let (str) args)
						(kvs-find1st (k) str)
					}
					Cache
					Watch
				)
			)
			`locsize部分`
			(let me  
				(reduce 
					locsize 
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
					[]
				)
			)
			(let user-result (kvs-match user-result))
			(let me
				(kvs-reduce (user-result 'out)
					{
						(let (init v k) args)
						(kvs-extend k v init)
					}
					me
				)
			)
			(let 
				(getElement element-init element-destroy) 
				(Parse 
					(user-result 'element)
					`Watch 给内部使用的`
					{
						(let w  (apply Watcher args))
						(watchPool 
							(extend w 
								(watchPool)
							)
						)
						w
					}
					k
					mve
				)
			)
			(let 
				user-init (default (user-result 'init) empty-fun)
				user-destroy (default (user-result 'destroy) empty-fun)
			)
			(list 
				getElement
				`init`
				{
					(element-init)
					(user-init)
				}
				`destroy`
				{
					(user-destroy)
					(element-destroy)
					(forEach (watchPool) 
						{
							(let (id update disable) (first args))
							(disable)
						}
					)
				}
				`out`
				me
			)
		})
		ret
	}
]
