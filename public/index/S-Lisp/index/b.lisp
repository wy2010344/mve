(log '我是B文件)
(log (reduce [a b c]
	{
		(let (init v i) args)
		(extend v init)
	}
	[]
))
{
	(log 'b文件返回)
}