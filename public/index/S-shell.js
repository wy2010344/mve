({
    data:{
        SLisp:"./S-Lisp/index.js"
    },
    success:function(){
        return mve(function(me){
            var appendErr=function(e){
                mb.log(e);
                me.k.show.appendChild(jsdom.parseElement({
                    type:"pre",
                    style:{
                        color:"red"
                    },
                    text:e
                }));
            };
            var appendResult=function(result) {
                me.k.show.appendChild(jsdom.parseElement({
                    type:"pre",
                    style:{
                        color:"#00BCD4"
                    },
                    text:result
                }));
            };
            var appendLog=function(cs){
                me.k.show.appendChild(jsdom.parseElement({
                    type:"pre",
                    text:cs.join("\t")
                }));
            };
            var runFunc=function(exec){
                return function(){
                    var input=me.k["in"].value;
                    if(input.trim()!=""){
                        me.k.show.appendChild(jsdom.parseElement({
                            type:"div",
                            children:[
                                ">>",
                                {
                                    type:"pre",
                                    text:input
                                },
                                "<<"
                            ]
                        }));
                        try{
                            exec(input);
                        }catch(e){
                            appendErr(e);
                        }
                        me.k.show.scrollTop=me.k.show.scrollHeight-me.k.show.clientHeight;
                        me.k["in"].value="";
                    }
                };
            };
            var run_s_lisp=runFunc(
                lib.SLisp.shell(
                    appendLog,
                    appendResult
                )
            );
            var height=me.Value(0);
            var width=me.Value(0);
            var move=me.Value();
            var allHeight=function(){
                return height()-42;
            };

            var showPercent=0.5;
            var inputPercent=0.5;
            return {
                height:height,
                width:width,
                element:{
                    type:"div",
                    children:[
                        {
                            type:"div",
                            style:{
                                position:"relative",
                                width:function(){
                                    return width()-2+"px";
                                },
                                height:function(){
                                    return height()-2+"px";
                                },
                                border:"1px solid gray"
                            },
                            action:{
                                mouseup:function(e){
                                    var m=move();
                                    if(m){
                                        var h=allHeight();
                                        showPercent=m.show/h;
                                        inputPercent=m.input/h;
                                        move(null);
                                    }
                                },
                                mousemove:function(e){
                                    if(move()){
                                        //mb.log(e);
                                        var m=move();
                                        var y=e.clientY-m.lastE.clientY;
                                        m.show=m.show+y;
                                        m.input=m.input-y;
                                        m.lastE=e;
                                        move(m);
                                    }
                                }
                            },
                            children:[
                                {
                                    type:"div",
                                    id:"show",
                                    style:{
                                        overflow:"auto",
                                        margin:0,
                                        height:function(){
                                            if(move()){
                                                return move().show+"px";
                                            }else{
                                                return allHeight()*showPercent+"px";
                                            }
                                        }
                                    }
                                },
                                {
                                    type:"div",
                                    style:{
                                        height:"10px",
                                        "background-color":"gray",
                                        cursor:"row-resize"
                                    },
                                    action:{
                                        mousedown:function(e){
                                            move({
                                                lastE:e,
                                                show:allHeight()*showPercent,
                                                input:allHeight()*inputPercent
                                            });
                                        }
                                    }
                                },
                                {
                                    type:"textarea",
                                    id:"in",
                                    style:{
                                        width:"100%",
                                        margin:0,
                                        border:0,
                                        padding:0,
                                        resize:"none",
                                        height:function(){
                                            if(move()){
                                                return move().input+"px";
                                            }else{
                                                return allHeight()*inputPercent+"px";
                                            }
                                        }
                                    },
                                    action:{
                                        keydown:function(e){
                                            mb.DOM.inputTabAllow(e);
                                            if(e.ctrlKey && e.keyCode==13){
                                                //ctrl+enter
                                                run_s_lisp();
                                            }
                                        }
                                    }
                                },
                                {
                                    type:"div",
                                    style:{
                                        height:"30px",
                                        position:"absolute",
                                        right:0
                                    },
                                    children:[
                                        {
                                            type:"button",
                                            text:"ctrl+enter",
                                            action:{
                                                click:run_s_lisp
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };
        });
    }
});