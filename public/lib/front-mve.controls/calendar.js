define(["require", "exports", "../mve/util"], function (require, exports, util_1) {
    "use strict";
    exports.__esModule = true;
    exports.makeCalendar = void 0;
    function makeCalendar() {
        //第一列是星期1-7
        var firstWeek = util_1.mve.valueOf(7);
        var firstDayDate = new Date();
        firstDayDate.setDate(1);
        var year = util_1.mve.valueOf(firstDayDate.getFullYear());
        var month = util_1.mve.valueOf(firstDayDate.getMonth() + 1);
        //这个月有多少天
        var dayCount = util_1.mve.valueOf(0);
        //这个月第一天是星期几
        var firstDay = util_1.mve.valueOf(0);
        function reload() {
            dayCount(mb.Date.getDays(year(), month()));
            firstDay(firstDayDate.getDay());
        }
        reload();
        return {
            /**上个月的总天数*/
            lastMonthDays: function () {
                var m = month() - 1;
                var y = year();
                if (m < 1) {
                    m = 12;
                    y = y - 1;
                }
                return mb.Date.getDays(y, m);
            },
            /**这个月有多少天*/
            days: dayCount,
            /**年份 */
            year: function () {
                if (arguments.length == 0) {
                    return year();
                }
                else {
                    var v = arguments[0];
                    year(v);
                    firstDayDate.setFullYear(v);
                    reload();
                }
            },
            /**月份*/
            month: function () {
                if (arguments.length == 0) {
                    return month();
                }
                else {
                    var v = arguments[0];
                    firstDayDate.setMonth(v - 1);
                    month(firstDayDate.getMonth() + 1);
                    year(firstDayDate.getFullYear());
                    reload();
                }
            },
            /**
             * 第一列是星期几(1-7)
             * @param v
             */
            firstWeek: function (v) {
                var i = v % 7;
                if (i == 0) {
                    i = 7;
                }
                firstWeek(i);
            },
            /**
             * 星期的列表，如"一二三四五六日".split("")
             * 下标映射下标
             * @param i 下标，0-6
             * @returns 映射下标
             */
            weekDay: function (i) {
                return (i + firstWeek() - 1) % 7;
            },
            /**
             * x列y行是几号
             * @param x
             * @param y
             */
            dayOf: function (x, y) {
                var diff = firstDay() - firstWeek();
                if (diff < 0) {
                    diff = diff + 7;
                }
                return x + y * 7 + 1 - diff;
            }
        };
    }
    exports.makeCalendar = makeCalendar;
});
