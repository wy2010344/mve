
(let x {
	(log 9)
})
(quote 88)
(log 988 7)	

(let a (load './a.lisp) b (load './b.lisp))
(let mve (load '../util/mve/index.lisp))
(let x* a)
( (x 'b) )
{
	(log 98 7)	
}
(mve
	{
		(let me* args)
		(let a (me.Value 9))
		(log (a))
		(a (+ (a) 1))
		(log (a))
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
								text 我是中国人
							]
							[
								type li
								text 你也说中文
							]
						]
					]
					[
						type input
						value 98
					]
					[
						type (load './ca.lisp)
						params [
							x y z
						]
					]
					"中国人"
				]
			]
		]
	}
)