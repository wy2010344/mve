
var router=require('express').Router();
var fs=require("fs");
var path=require('path');
var resolve=function(p){
    return path.join('./public/',p);
};


var circle=function(core,p,prefix) {
	var files=fs.readdirSync(p);
	files.forEach(function(file,i) {
		var f_path=p+"/"+file;
		var f_name=prefix+file;
		
		var info = fs.statSync(f_path);
		if(info.isDirectory()){
			circle(core,f_path,f_name+"/");
		}else{
			if(file.endsWith(".lisp")){
				core[f_name]=fs.readFileSync(f_path,"utf-8");
			}
		}
	});
};

router.get("/package",function(req,res,next) {
	var core={};
	var dir=process.env.S_LISP||"./S-Lisp";
	circle(core,dir,"lib-path/");
	var p="./public/index/S-Lisp/";
	circle(core,p,"index/S-Lisp/");
	fs.writeFile(p+"core.js", JSON.stringify(core,"",2),function(err){
		res.json({
			code:0,
			description:"操作成功"
		});
	});
});

module.exports=router;