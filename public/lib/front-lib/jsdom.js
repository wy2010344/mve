define(["require", "exports"], function (require, exports) {
    "use strict";
    var bind = function (v, f) {
        if (typeof (v) == 'function') {
            v(f);
        }
        else {
            f(v);
        }
    };
    var bindIF = function (v, f) {
        if (v != undefined) {
            bind(v, f);
        }
    };
    var bindMapIF = function (map, f) {
        if (map) {
            mb.Object.forEach(map, function (v, k) {
                bind(v, function (newV) {
                    f(k, newV);
                });
            });
        }
    };
    /**
     * 是否要用id，造成手写DOM。如果用一点观察者模式，似乎会优化更多？通知中心，而不是全部用事件。本来想全用事件，但又离不开面向对象。事件就有内部的和外部的。
     * 事件绑定属性，还有初始化的。
     * 通知中心内聚成某个方法，但id还是显露被外部持有。但省掉了初始化构造。
     */
    /*
    功能不能太复杂了，或许是每次全部重新加载的模板。只作为原生的替换初始化的模板引擎函数。要实现复杂的，则自行加载其它自定义组件。
    但动态增加组件，为了不触碰init，需要array的方法。
    还是恢复ArrayModel，妥协的，解决大多数问题。
    但要支持外部插件，如hover\select等扩展，而不写死在内部
    
    用面向对象的方式，children是数组域，管理的就是控制器，不是数据与视图分离。数据与视图结合的控制器，就是自己的业务模型。有select。默认select与自定义（返回bool是否接受select）
    数组管理的组件，有相应的与后端业务的更新方法。但insert是数据,remove是controller,move是顺序，不介入。
    用自组件方式，不再反复显式调用parseEL，k也不再暴露在外。最初调用jsdom，以后加载自动都在其中，只是写配置。组件返回一个字典，me={k:{},init:{},public:{}}，public中是显式调用的。
    
    不，children始终是依赖注入的slot，是注入实例不是注入类，不是Array数组。但这是针对扩展列表，不是原生的。只能实现初始化的mvc，不能实现动态的mvvm，未来要改变，只有重新reload。
    所以不允许，可以用匿名生成数组为结果
    */
    function bindId(me, id, obj) {
        if (id) {
            if (typeof (id) == 'function') {
                id(obj);
            }
            else {
                me[id] = obj;
            }
        }
    }
    function parseEL(json, me) {
        if (!json) {
            json = "";
        }
        var json_type = typeof (json);
        if (json_type == 'function') {
            json = json();
        }
        else if (json_type != 'object') {
            return document.createTextNode(json);
        }
        else {
            var el;
            var type = json.type;
            var children = json.children;
            var id = json.id;
            if (typeof (type) == 'string') {
                el = document.createElement(type);
                bindId(me, id, el);
                if (children) {
                    if (mb.Array.isArray(children)) {
                        mb.Array.forEach(children, function (child, i) {
                            el.appendChild(parseEL(child, me));
                        });
                    }
                    else if (typeof (children) == 'function') {
                        /**
                         * 子结点延迟可以异步加载，但其它属性节点有必要吗？
                         * 复杂点就是显式写mve.Watch(exp:)
                         */
                        children(el);
                    }
                    else {
                        var c_va = children.type(el, children.params);
                        var c_id = children.id;
                        bindId(me, c_id, c_va);
                    }
                }
            }
            else {
                if (type) {
                    var params = json.params || {};
                    if (children) {
                        mb.Object.forEach(children, function (value, key) {
                            params[key] = parseEL(value, me);
                        });
                    }
                    var obj = type(params);
                }
                else if (json.jsdom) {
                    //自动注入的
                    var obj = json.jsdom;
                }
                bindId(me, id, obj);
                if (obj.init) {
                    var init = me.init || mb.Function.quote.one;
                    me.init = function () {
                        obj.init();
                        init();
                    };
                }
                el = obj.element;
            }
            var actions = json.action;
            if (actions) {
                mb.Object.forEach(actions, function (value, key) {
                    mb.DOM.addEvent(el, key, value);
                });
            }
            //类
            var cls = json.cls;
            if (cls) {
                var type_cls = typeof (cls);
                if (type_cls == 'object') {
                    var cls_o = cls.type(el, cls.params);
                    var cls_id = cls.id;
                    if (cls_id) {
                        me.k[cls_id] = cls_o;
                    }
                }
                else if (type_cls == 'function') {
                    cls(mb.DOM.cls(el));
                }
                else {
                    el.setAttribute("class", cls);
                }
            }
            //attr
            bindMapIF(json.attr, function (key, value) {
                el.setAttribute(key, value);
            });
            //style字典
            bindMapIF(json.style, function (key, value) {
                try {
                    el.style[key] = value;
                }
                catch (ex) {
                    mb.log(ex);
                }
            });
            //innerText
            bindIF(json.text, function (v) {
                el.innerText = v;
            });
            //innerHTML
            bindIF(json.html, function (v) {
                el.innerHTML = v;
            });
            //input等的value
            bindIF(json.value, function (v) {
                el.value = v;
            });
            return el;
        }
    }
    ;
    var jsdom = {
        /**
         * 没办法面向对象化。
         * 禁止转发，
         * 从parseElement到new的跨度
         */
        parseElement: function (json, me) {
            me = me || {};
            me.k = me.k || {};
            var el = parseEL(json, me);
            me.element = el;
            return el;
        },
        parseFragment: function (json, me) {
            me = me || {};
            me.k = me.k || {};
            var fg = document.createDocumentFragment();
            for (var i = 0; i < json.length; i++) {
                fg.appendChild(parseEL(json[i], me));
            }
            return fg;
        },
        /**
         * 没有public方法的
         * p{
         * init:可选
         * body:json
         * }
         */
        page: function (p) {
            var me = {};
            me.k = {};
            me.init = p.init;
            me.element = parseEL(p.body, me);
            return me;
        },
        /**
         * 参数里有
         * 回调函数，
         * 高阶类型，
         * 电线（单独变化的值）数组（除电线外，有insert\remove等子信号）——数组是否需要？暂时不支持吧。
         * 没有public方法，只返回一个元素，没有init方法，跟vue贴近。
         * 其实jsdom.parseElement也支持，而且还附带public方法。
         * 只是可以传电流了——这种优化
         */
        circuit: function (json) {
        }
    };
    return jsdom;
});
