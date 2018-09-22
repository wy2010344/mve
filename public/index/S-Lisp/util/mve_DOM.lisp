{
	(let 
		DOM (load './DOM.lisp)
	)
	[
		DOM (quote DOM)
		mve ((load './mve/index.lisp) DOM)
	] 
}