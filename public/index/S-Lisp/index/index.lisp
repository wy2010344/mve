{
	(let x {
		(log 9)
	})
	(quote 88)
	(log 988 7)	
	(let a (load './a.lisp) b (load './b.lisp))
	(let x (kvs-match (a)))
	( (x 'b) )
	{
		(log 98 7)	
	}
	(mve
		{
			(let (Value k Cache) args)
			(let a (Value 9))
			(log (a))
			(a (+ (a) 1))
			(log (a))
			(let array (Value [a b c d e f g h]))
			[
				element [
					type div
					action [
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
							action [
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
							action [
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
									action [
										click {
											(let el (k 'ipx))
											(let v (DOM 'value el ))
											(if-run (= 0 (str-length (str-trim v)))
												{
													(DOM 'alert '无内容)
												}
												{
													(if-run (DOM 'confirm "确定添加？")
														{
																	(array (extend v (array)))
																	(DOM 'value el "")
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
									(let (data index) args)
									[
										type li
										children [
											[
												type button text x 
												action [
													click {
														(log (index))
														(array (splice (array) (index) 1))
													}
												]
											]
											{
												(str-join 
													[
														(index)
														------
														(data)
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