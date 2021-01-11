 /*
* Tween.js
* t: current time（当前时间）；
* b: beginning value（初始值）；
* c: change in value（变化量）；
* d: duration（持续时间）。
* you can visit 'http://easings.net/zh-cn' to get effect
*/

export interface TweenFun{
	/**
	 * @param t current time（当前时间）
	 * @param b beginning value（初始值）
	 * @param c change in value（变化量）
	 * @param d duration（持续时间）
	 * @returns 位移
	 */
	(t:number,b:number,c:number,d:number):number
}

export interface TweenPkg{
	easeIn:TweenFun
	easeOut:TweenFun
	easeInOut:TweenFun
}

/**
 * 产生动画
 * @param xp 
 */
export function TweenAnimation(xp:{
	/**持续时间 毫秒，1000毫秒是1秒*/
	duration:number
	/**结束的值 */
	max:number
	/**回调位移,与时间 */
	call?(num:number,t:number):void
	/**位移变化，与时间变化 */
	diff?(num:number,t:number):void
	/**使用的动画 */
	change:TweenFun,
	/**结束时调用 */
	end?():void
}){

	const start=Date.now()
	const calls:((num:number,t:number)=>void)[]=[]
	if(xp.call){
		calls.push(xp.call)
	}
	if(xp.diff){
		let lastnum=0
		let lastT=0
		calls.push(function(num,t){
			xp.diff(num-lastnum,t-lastT)
			lastnum=num
			lastT=t
		})
	}
	function oneCall(num:number,t:number){
		for(let call of calls){
			call(num,t)
		}
	}
	function animate(){
		const t=Date.now()-start
		if(t>xp.duration){
			//结束
			oneCall(xp.max,xp.duration)
			if(xp.end){
				xp.end()
			}
		}else{
			const y=xp.change(t,0,xp.max,xp.duration)
			oneCall(y,t)
			requestAnimationFrame(animate)
		}
	}
	animate()
}

export const Tween={
	Linear:<TweenFun>function(t, b, c, d) { return c*t/d + b; },
	Quad:<TweenPkg>{
		easeIn: function(t, b, c, d) {
			return c * (t /= d) * t + b;
		},
		easeOut: function(t, b, c, d) {
			return -c *(t /= d)*(t-2) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t + b;
			return -c / 2 * ((--t) * (t-2) - 1) + b;
		}
	},
	Cubic:<TweenPkg>{
		easeIn: function(t, b, c, d) {
			return c * (t /= d) * t * t + b;
		},
		easeOut: function(t, b, c, d) {
			return c * ((t = t/d - 1) * t * t + 1) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t*t + b;
			return c / 2*((t -= 2) * t * t + 2) + b;
		}
	},
	Quart: <TweenPkg>{
		easeIn: function(t, b, c, d) {
			return c * (t /= d) * t * t*t + b;
		},
		easeOut: function(t, b, c, d) {
			return -c * ((t = t/d - 1) * t * t*t - 1) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
			return -c / 2 * ((t -= 2) * t * t*t - 2) + b;
		}
	},
	Quint: <TweenPkg>{
		easeIn: function(t, b, c, d) {
			return c * (t /= d) * t * t * t * t + b;
		},
		easeOut: function(t, b, c, d) {
			return c * ((t = t/d - 1) * t * t * t * t + 1) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
			return c / 2*((t -= 2) * t * t * t * t + 2) + b;
		}
	},
	Sine: <TweenPkg>{
		easeIn: function(t, b, c, d) {
			return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
		},
		easeOut: function(t, b, c, d) {
			return c * Math.sin(t/d * (Math.PI/2)) + b;
		},
		easeInOut: function(t, b, c, d) {
			return -c / 2 * (Math.cos(Math.PI * t/d) - 1) + b;
		}
	},
	Expo: <TweenPkg>{
		easeIn: function(t, b, c, d) {
			return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
		},
		easeOut: function(t, b, c, d) {
			return (t==d) ? b + c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeInOut: function(t, b, c, d) {
			if (t==0) return b;
			if (t==d) return b+c;
			if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
			return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
	},
	Circ: <TweenPkg>{
		easeIn: function(t, b, c, d) {
			return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
		},
		easeOut: function(t, b, c, d) {
			return c * Math.sqrt(1 - (t = t/d - 1) * t) + b;
		},
		easeInOut: function(t, b, c, d) {
			if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
			return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
		}
	},
	Elastic: <TweenPkg>{
		easeIn: function(t, b, c, d, a, p) {
			var s;
			if (t==0) return b;
			if ((t /= d) == 1) return b + c;
			if (typeof p == "undefined") p = d * .3;
			if (!a || a < Math.abs(c)) {
				s = p / 4;
				a = c;
			} else {
				s = p / (2 * Math.PI) * Math.asin(c / a);
			}
			return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		},
		easeOut: function(t, b, c, d, a, p) {
			var s;
			if (t==0) return b;
			if ((t /= d) == 1) return b + c;
			if (typeof p == "undefined") p = d * .3;
			if (!a || a < Math.abs(c)) {
				a = c; 
				s = p / 4;
			} else {
				s = p/(2*Math.PI) * Math.asin(c/a);
			}
			return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
		},
		easeInOut: function(t, b, c, d, a, p) {
			var s;
			if (t==0) return b;
			if ((t /= d / 2) == 2) return b+c;
			if (typeof p == "undefined") p = d * (.3 * 1.5);
			if (!a || a < Math.abs(c)) {
				a = c; 
				s = p / 4;
			} else {
				s = p / (2  *Math.PI) * Math.asin(c / a);
			}
			if (t < 1) return -.5 * (a * Math.pow(2, 10* (t -=1 )) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
			return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p ) * .5 + c + b;
		}
	},
	Back: <TweenPkg>{
		easeIn: function(t, b, c, d, s) {
			if (typeof s == "undefined") s = 1.70158;
			return c * (t /= d) * t * ((s + 1) * t - s) + b;
		},
		easeOut: function(t, b, c, d, s) {
			if (typeof s == "undefined") s = 1.70158;
			return c * ((t = t/d - 1) * t * ((s + 1) * t + s) + 1) + b;
		},
		easeInOut: function(t, b, c, d, s) {
			if (typeof s == "undefined") s = 1.70158; 
			if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
			return c / 2*((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
		}
	},
	Bounce: <TweenPkg>function(){
		function easeOut(t, b, c, d) {
			if ((t /= d) < (1 / 2.75)) {
				return c * (7.5625 * t * t) + b;
			} else if (t < (2 / 2.75)) {
				return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
			} else if (t < (2.5 / 2.75)) {
				return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
			} else {
				return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
			}
		}
		function easeIn(t, b, c, d) {
			return c - Tween.Bounce.easeOut(d-t, 0, c, d) + b;
		}
		function easeInOut(t, b, c, d) {
			if (t < d / 2) {
				return easeIn(t * 2, 0, c, d) * .5 + b;
			} else {
				return easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
			}
		}
		return {
			easeIn,
			easeInOut,
			easeOut,
		}
	}()
}

export interface DrawOfBezier3{
	start:number
	c1:number
	end:number
	c2:number
}
/***
 * 3阶贝塞尔，X方向与Y方向的计算是一样的。
 * @param startY 开始点Y
 * @param c1Y 开始点的控制点1
 * @param endY 结束点Y
 * @param c2Y 结束点的控制点2
 * @returns 动画函数
 */
export function drawOfBezier3(p:DrawOfBezier3):TweenFun{
 return function bezierFun(t,b,c,d){
	 t = t/d;
	 var y = p.start*Math.pow(1-t,3)+
						3*p.c1*t*Math.pow(1-t,2)+
						3*p.c2*Math.pow(t,2)*(1-t)+
						p.end*Math.pow(t,3);
	 return b+(300-y)/200*c;
 }
}