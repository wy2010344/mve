import { mve } from "../mve/util"


export function makeCalendar(){
	//第一列是星期1-7
	const firstWeek=mve.valueOf(7)
	const firstDayDate=new Date()
	firstDayDate.setDate(1)
	const year=mve.valueOf(firstDayDate.getFullYear())
	const month=mve.valueOf(firstDayDate.getMonth() + 1)
	//这个月有多少天
	const dayCount=mve.valueOf(0)
	//这个月第一天是星期几
	const firstDay=mve.valueOf(0)
	function reload(){
		dayCount(mb.Date.getDays(year(),month()))
		firstDay(firstDayDate.getDay())
	}
	reload()
	return {
		/**上个月的总天数*/
		lastMonthDays(){
			let m = month() - 1
			let y =  year()
			if(m < 1){
				m = 12
				y = y - 1
			}
			return mb.Date.getDays(y,m)
		},
		/**这个月有多少天*/
		days:dayCount as mve.GValue<number>,
		/**年份 */
		year:<mve.Value<number>>function(){
			if(arguments.length==0){
				return year()
			}else{
				const v=arguments[0]
				year(v)
				firstDayDate.setFullYear(v)
				reload()
			}
		},
		/**月份*/
		month:<mve.Value<number>>function(){
			if(arguments.length==0){
				return month()
			}else{
				const v=arguments[0]
				firstDayDate.setMonth(v - 1)
				month(firstDayDate.getMonth()+1)
				year(firstDayDate.getFullYear())
				reload()
			}
		},
		/**
		 * 第一列是星期几(1-7)
		 * @param v 
		 */
		firstWeek(v:number){
			let i = v % 7
			if(i==0){
				i=7
			}
			firstWeek(i)
		},
		/**
		 * 星期的列表，如"一二三四五六日".split("")
		 * 下标映射下标
		 * @param i 下标，0-6
		 * @returns 映射下标
		 */
		weekDay(i:number):number{
			return (i + firstWeek() - 1) % 7
		},
		/**
		 * x列y行是几号
		 * @param x 
		 * @param y 
		 */
		dayOf(x:number,y:number){
			let diff=firstDay() - firstWeek()
			if(diff < 0){
				diff = diff + 7
			}
			return x + y * 7 + 1 - diff
		}
	}
}