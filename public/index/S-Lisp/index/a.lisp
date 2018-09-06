{
	(log '我是A文件)

	(let x (load './b.lisp))
	(if-run (> 9 8)
			{
				(log '小于98)
			}
			{
				(log '大于98)
			}
	)
	(x)
	[
		a 98 b {
			(log 'as文件返回)
		}
	]
}