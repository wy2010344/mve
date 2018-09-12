{
	(let 
		(notice) args
		require-factory (load '../util/require-factory.lisp)
		mve ((load '../util/mve/index.lisp))
	)
	(
		(require-factory 
			{
				(let (url success) args)
				(if-run (str-endsWith url "s-html")
					{
						{
							(mve success)
						}
					}
					{
						success
					}
				)
			}
		)
		index-path 
		{
			(let (success) args)
			(notice success)
		}
	)
}