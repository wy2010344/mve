


{
	(let 
		(doSuccess) args
		caches (cache [])
		getTxt {
			(js-call 'mb.ajax.require 'getTxt args)
		}
		calUrl {
			(js-call 'mb.ajax.require 'calUrl 
	 			(extend 
	 				(js-call 'mb.ajax.require.cp 'baseUrl [])
	 				args
	 			)
	 		)
		}
	)
	{
		(let (url notice) args require this)
		(let value (kvs-find1st (caches) url))
		(if-run (exist? value)
			{
				(notice (first value))
			}
			{
				(getTxt url {
					(let 
						txt (str-join ["["  (first args)  "]"] " ")
						lib (cache [])
						scope (
							kvs-extend "lib" 
							{
								(let (k) args)
								(kvs-find1st (lib) k)
							} 
							base-scope
						)
						body (parse txt scope)
						success (doSuccess url (kvs-find1st body 'success))
						delay (default (kvs-find1st body 'delay) false)
						data (kvs-find1st body 'data)
					)
					`先加载到池子中`
					(caches 
						(kvs-extend 
							url 
							(list 
								(if-run delay {(success)} {success})
							)
							(caches)
						)
					)
					`递归加载库引用`
					(async-kvs-reduce
						{
							`success`
							(lib (first args))
							(notice success)
						}
					 	data
					 	{
					 		(let (notice init v k) args)
					 		(require (calUrl url v){
					 			(notice
					 				(kvs-extend k (first args) init)
					 			)
					 		})
					 	}
					 	[]
					)
				})
			}
		)
	}
}