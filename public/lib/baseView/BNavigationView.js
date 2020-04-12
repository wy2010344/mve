define(["require", "exports", "./index", "./ArrayModel"], function (require, exports, index_1, ArrayModel_1) {
    "use strict";
    exports.__esModule = true;
    function navigationOf(mve, p) {
        var superArray = new ArrayModel_1.BSuper(p.view);
        mve.Watch(function () {
            p.view.setW(p.width());
        });
        mve.Watch(function () {
            var i = 0;
            while (i < superArray.count()) {
                superArray.get(i).view.setW(p.width());
                i++;
            }
        });
        mve.Watch(function () {
            p.view.setH(p.height());
        });
        mve.Watch(function () {
            var i = 0;
            while (i < superArray.count()) {
                superArray.get(i).view.setH(p.height());
                i++;
            }
        });
        var it = {
            width: p.width,
            height: p.height,
            push: function (get) {
                superArray.push(get);
            },
            pop: function () {
                superArray.pop();
            },
            redirect: function (get) {
                superArray.pop();
                superArray.push(get);
            },
            count: function () {
                return superArray.count();
            }
        };
        return it;
    }
    exports.navigationOf = navigationOf;
    function dialogBack() {
        var view = new index_1.BView();
        view.setBackground("white");
        return view;
    }
    function dialogOf(navigation, mve, p) {
        var view = p.view ? p.view : dialogBack();
        mve.Watch(function () {
        });
        return {
            view: view
        };
    }
    exports.dialogOf = dialogOf;
});
