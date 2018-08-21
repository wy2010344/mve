(let util (kvs-match (load './util.lisp))
	 Parse (load './parse.lisp)
	 DOM (load './DOM.lisp)
	 build-children (load './build-children.lisp)
	 nokey (load './nokey.lisp)
)
((util 'Exp) 
	(Parse
		DOM
		(build-children
			(util 'Value)
			(util 'Watcher)
			DOM
			nokey
		)
		(util 'locsize)
	)
)