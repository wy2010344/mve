

(let mve (load '../util/mve/index.lisp))
{
	(let (a b c ) args)
	(mve
		{
			(let (me) args)
			(let ak (me 'Value 98))
			[
				init {
					(log '我是子组件初始化)
				}
				destroy {
					(log '我是子组件销毁)
				}
				element {
					[
						type div
						attr [
							a 0 b 1
						]
						children [
							[
								type button
								action [
									click {
										(ak (+ (ak) 1 ))
									}
								]
								text (str-join [我是组件 (ak)])
							]
						]
					]
				}
			]
		}
	)
}