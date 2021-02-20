define(["require", "exports", "../../mve-DOM/index", "../../mve/modelChildren", "../../mve/util"], function (require, exports, index_1, modelChildren_1, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.navigation = void 0;
    function navigation(p) {
        return index_1.parseHTML.mve(function (me) {
            var current = util_1.mve.valueOf(null);
            var model = util_1.mve.arrayModelOf([]);
            var params = {
                current: current,
                size: function () {
                    return model.size();
                },
                pop: function () {
                    model.pop();
                    current(model.getLast());
                },
                push: function (type, v) {
                    /*
                    init
                    destroy
                    title:Function/String
                    children:[]
                    */
                    var o = type(params, v);
                    model.push(o);
                    current(o);
                }
                /*,
                load:function(url,after){
                    mb.ajax.require(url,function(type){
                        var obj=params.push(type);
                        if(after){
                            after(obj);
                        }
                    });
                },
                load_with:function(url,args,after){
                    mb.ajax.require(url,function(fun){
                        var type=fun(args);
                        var obj=params.push(type);
                        if(after){
                            after(obj);
                        }
                    });
                }*/
            };
            return p.render(me, params, {
                build_head_children: function (repeat) {
                    return modelChildren_1.modelChildren(model, repeat);
                },
                build_body_children: function (repeat) {
                    return modelChildren_1.modelChildren(model, function (me, row, index) {
                        var element = repeat(me, row, index);
                        element.style = element.style || {};
                        element.style.display = function () {
                            return current() == row ? "" : "none";
                        };
                        return element;
                    });
                }
            });
        });
    }
    exports.navigation = navigation;
});
