var express=require('express');

var app=express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.use("/S-Lisp",require("./S-Lisp.js"))

var server=app.listen(3000,function() {
	console.log("访问:http://localhost:3000/");
});