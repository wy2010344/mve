

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
		(let (pel children init destroy mve) args)
		(let c* (children))
		(let isInit (cache false))
		(init 
			(extend {(isInit true)} (init))
		)
		(let bc* 
			(nokey 
				'build (build c.repeat mve)
				'after {
					(let voi 
						(kvs-path (first args) [obj init])
					)
					(if-run (exist? voi)
						{
							(if-run (isInit)
								{
									(voi)
								}
								{
									(init (extend voi (init)))
								}
							)
						}
					)
				}
				'appendChild {
					(let el 
						(kvs-path-run (first args)  
							[obj getElement]
						)
					)
					(DOM 'appendChild pel  el)
				}
				'removeChild {
					(DOM 'removeChild pel
						(kvs-path-run (first args)
							[obj getElement]
						)
					)
				}
			)
		)
		(let watch (Watcher 
			'exp {
				(c.array)
			}
			'after {
				(bc.after (first args))
			}
		))
		(destroy  
			(extend 
				{ 
					(watch disable) 
					(bc.destroy)
				} 
				(destroy)
			)
		)
	}
}