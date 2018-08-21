

{
	`从util里调入`
	(let (Value Watcher DOM nokey) args)
	(let build {
		`下面调入`
		(let (repeat mve) args)
		{
			`最终调入`
			(let (row i) args)
			(let o [
					data (Value row)
					index (Value i)
				]
			)
			[
				row 'o
				obj (mve {
					[
						element {
							(repeat o)
						}
					]
				})
			]
		}
	})
	{
		(let 
			(pel children inits destroys mve) args
			`c.array c.repeat`
			cd (kvs-match (children))
			`是否初始化`
			isInit (cache false)
			`未初始化时缓存值`
			c-inits (cache [])
			(bc-after bc-destroy) 
				(nokey 
					`build` 
					(build (cd 'repeat) mve)
					`after` 
					{
						(let voi 
							(kvs-path (first args) [obj init])
						)
						(if-run (exist? voi)
							{
								(if-run (isInit)
									{(voi)}
									{
										(c-inits (extend voi (c-inits)))
									}
								)
							}
						)
					}
					`appendChild` 
					{
						(let el 
							(kvs-path-run (first args)  
								[obj getElement]
							)
						)
						(DOM 'appendChild pel  el)
					}
					`removeChild` 
					{
						(DOM 'removeChild pel
							(kvs-path-run (first args)
								[obj getElement]
							)
						)
					}
				)
			`Array的计算观察`
			watch 
				(Watcher 
					`before`
					[]
					`exp`
					{
						((cd 'array))
					}
					`after` 
					{
						(bc-after (first args))
					}
				)
		)
		(list 
			`inits`
			(extend 
				{
					(forEach (c-inits)
						{
							((first args))
						}
					)
					(c-inits [])
					(isInit true)
				} 
				inits
			) 
			`destroys`
			(extend 
				{ 
					(watch disable) 
					(bc-destroy)
				} 
				destroys
			)
		)
	}
}