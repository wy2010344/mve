import { EModel } from "./model";

export={
	build(e:EModel,repeat,mve,getO){
		return function(row,i){
			var o=getO(row,i);
			var obj=mve(function(me){
				/*相当于修饰*/
				return repeat(me,o.data,o.index);
			})(e);
			return {
				row:o,
				obj:obj
			};
		};
	},
	getInit(view){
		return view.obj.init;
	},
	init(view){
		view.obj.init();
	},
	destroy(view){
		view.obj.destroy();
	}
}