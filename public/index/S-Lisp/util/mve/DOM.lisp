
(let kvs 
	[
		createElement {
			(let (type NS) args)
			(if-run (exist? NS)
				{
					(js-call 'document 'createElement (list NS type))
				}
				{
					(js-call 'document 'createElement (list type))
				}
			)
		}
		createTextNode {
			(js-call 'document 'createTextNode args)
		}
		appendChild {
			(let (el child) args)
			(js-call el 'appendChild (list child))
		}
		replaceWith {
			(let (old-e new-e) args)
			(let pn (js-attr old-e 'parentNode))
			(js-call pn 'replaceChild (list new-e old-e))
		}
		removeChild {
			(let (el child) args)
			(js-call el 'removeChild (list child))
		}
		attr {
			(let (el key value) args)
			(if-run (exist? value)
				{
					(js-call el 'removeAttribute (list key))
				}
				{
					(js-call el 'setAttribute (list key value))
				}
			)
		}
		style {
			(let (el key value) args)
			(js-attr (js-attr el 'style) key value)
		}
		prop {
			(let (el key value) args)
			(js-attr el key value)
		}
		action {
			(let (el key value) args)
			(js-call 'mb.DOM 'addEvent (list el key value))
		}
		text {
			(let (el value) args)
			(js-attr el 'innerText value)
		}
		value {
			(let (el value) args)
			(js-attr el 'value value)
		}
		html {
			(let (el value) args)
			(js-attr el 'innerHTML value)
		}
	]
)
{
	(let (key ...params) args)
	(apply (switch key kvs) params)
}