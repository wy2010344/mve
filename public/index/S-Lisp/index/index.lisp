{
	(let x {
		(log 9)
	})
	(quote 88)
	(log 988 7)	
	(let a (load './a.lisp) b (load './b.lisp))
	(let x (a))
	(x.b)
	{
		(log 98 7)	
	}
	(mve
		{
			(let me args)
			(let a (me.Value 9))
			(log (a))
			(a (+ (a) 1))
			(log (a))
			(let array (me.Value [a b c d e f g h]))
			[
				element [
					type div
					event [
						click {
							(log 98)
						}
					]
					attr [
						a 98 
						b 89
					]
					children [
						[
							type div
							attr [
								color red
							]
							text 你
						]
						[
							type div
							style [
								color red
								background-color gray
							]
							text 我
						]
						[
							type button
							text {
								(a)
							}
							event [
								click {
									(a (+ (a) 1))
								}
							]
						]
						[
							type button
							text {
								(+ (a) 1)
							}
							event [
								click {
									(a (+ (a) 2))
								}
							]
						]
						{
							[
								type div
								text (str-join [来吧 (a)])
							]
						}
						[
							type ul
							children [
								[
									type li
									text 试用S-Lisp
								]
								[
									type li
									text 试用mve
								]
							]
						]
						[
							type input
							value 'a
						]
						[
							type (load './ca.lisp)
							params [
								x y z
							]
						]
						"感谢支持"

						'测试children-repeat
						[
							type div
							children [
								[
									type input
									id ipx
								]
								[
									type button
									text {
										(str-join [(len (array)) 条记录])
									}
									event [
										click {
											(let el (me.k 'ipx))
											(let v (me.DOM.value el ))
											(if-run (= 0 (str-length (str-trim v)))
												{
													(me.DOM.alert '无内容)
												}
												{
													(if-run (me.DOM.confirm "确定添加？")
														{
															(array (extend v (array)))
															(me.DOM.value el "")
														}
													)
												}
											)
										}
									]
								]
							]
						]
						[
							type ul
							children-type kvs
							children [
								array 'array
								repeat {
									(let o args)
									[
										type li
										children [
											[
												type button text x 
												event [
													click {
														(array (splice (array) o.index 1))
													}
												]
											]
											{
												(str-join 
													[
														'o.index
														------
														(o.data)
													]
												)
											}
										]
									]
								}
							]
						]
						{
							(str-join [共 (len (array)) 条记录])
						}
					]
				]
			]
		}
	)
}