{
	(let 
		(notice) args
		require-factory (load '../util/require-factory.lisp)
	)
	(
		(require-factory 
			`全局作用域`
			(kvs-extend 'mve mve base-scope)
			`局部处理`
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
		`加载路径`
		index-path
		`成功通知` 
		{
			(apply notice args)
		}
	)
}