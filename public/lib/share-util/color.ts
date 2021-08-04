
export const GB_MAX_VALUE=255
export interface BGColor{
	red:number
	green:number
	blue:number
	alpha:number
}
/**
 * 从#36297b6b 转成 "{"red":54,"green":41,"blue":123,"alpha":255}"
 * @param v 
 */
export function bgColorfromHex(v:string){
	const color:BGColor={
		red:parseInt(v.substr(1,2),16),
		green:parseInt(v.substr(3,2),16),
		blue:parseInt(v.substr(5,2),16),
		alpha:255
	}
	if(v.length==9){
		//带alpha分量
		color.alpha=parseInt(v.substr(7,2),16)
	}
	return color
}

/**
 * 从"{"red":54,"green":41,"blue":123,"alpha":255}" 转成 #36297b6b
 * @param v 
 */
export function hexFromBgColor(v:BGColor){
	let color=`#${v.red.toString(16)}${v.green.toString(16)}${v.blue.toString(16)}`
	if(v.alpha!=GB_MAX_VALUE){
		color+=v.alpha.toString(16)
	}
	return color
}

/**
 * 从"{"red":54,"green":41,"blue":123,"alpha":255}" 转成 rgb(54,41,123)
 * @param v 
 */
export function rgbFromBgColor(v:BGColor){
	if(v.alpha!=GB_MAX_VALUE){
		return `rgba(${v.red},${v.green},${v.blue},${v.alpha / GB_MAX_VALUE})`
	}else{
		return `rgb(${v.red},${v.green},${v.blue})`
	}
}



export function random255(){
	return Math.round(Math.random() * 255)
}
export function randomColor(){
	return hexFromBgColor({
		red:random255(),
		green:random255(),
		blue:random255(),
		alpha:random255(),
	})
}