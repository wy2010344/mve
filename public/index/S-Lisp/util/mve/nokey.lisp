
{
	`与js的array不同，使用倒置的顺序`
	(let (p-build p-after p-appendChild p-removeChild) args)
	(let 
		caches (cache [])
		views (cache [])
		update-views {
			(let (array) args)
			({
				(let (vs as) args circle this)
				(if-run (exist? vs)
					{
						(let (v ...vs) vs (a ...as) as)
						(kvs-path-run  v [row data] a)
						(circle vs as)
					}
				)
			} (views) array)
		}
		len-c {
			(len 
				((first args))
			)
		}
	)
	[
		`after` 
		{
			(let (array) args)
			(if-run 
				(< (len array)(len-c views) )
				{
					`多出的`
					(let more (slice-from (views) (len array)))
					`移除视图上的元素`
					(forEach more 
						{
							(let (v) args)
							(p-removeChild v)
						}
					)
					`更新视图上数据`
					(views (slice-to (views) (len array)))
					(update-views array)
				}
				{
					(if-run 
						(< (len array) (len-c caches))
						{
							`向caches上增加`
							(let new-view (slice-to (caches) (len array)))
							(let more (slice-from new-view (len-c views)))
							(forEach more
								{
									(let (v) args)
									(p-appendChild v)
								}
							)
							(views new-view)
							(update-views array)
						}
						{
							`从caches向视图上增加`
							(let more (slice-from (caches) (len-c views)))
							(forEach more
								{
									(let (v) args)
									(p-appendChild v)
								}
							)
							(views (caches))
							(update-views array)
							`新增加`
							(let 
								c-l  (len-c caches)
								more (slice-from array c-l)
							)
							(let (more-k) (reduce more
									{
										(let 
											((init i) a) args
											i (+ i c-l 1)
											v (p-build a i)
										)
										(p-appendChild v)
										(p-after v)
										`因为把新增加的追加到后面了`
										(list 
											(extend v init)
											i
										)
									}
									[[] 0]
								)
							)
							(caches (combine-two (caches) (reverse more-k)))
							(views (caches))
						}
					)
				}
			)
		}
		`destroy`
		{
			(forEach (caches)
				{
					(let (c) args)
					(let destroy 
						(kvs-path c [obj destroy])
					)
					(if-run (exist? destroy) destroy)
				}
			)
		}
	]
}