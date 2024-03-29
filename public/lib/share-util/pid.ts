/**
 * 验证身份证
 * @param code 
 */
export function validatePid(code:string){
  //https://blog.csdn.net/zjslqshqz/article/details/73571736
  const city={11:"北京",12:"天津",13:"河北",14:"山西",15:"内蒙古",21:"辽宁",22:"吉林",23:"黑龙江 ",31:"上海",32:"江苏",33:"浙江",34:"安徽",35:"福建",36:"江西",37:"山东",41:"河南",42:"湖北 ",43:"湖南",44:"广东",45:"广西",46:"海南",50:"重庆",51:"四川",52:"贵州",53:"云南",54:"西藏 ",61:"陕西",62:"甘肃",63:"青海",64:"宁夏",65:"新疆",71:"台湾",81:"香港",82:"澳门",91:"国外 "} as {[key:string]:string};
  var tip = "";
  var pass= true;

  if(!code || !/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)){
    tip = "身份证号格式错误";
    pass = false;
  }

  else if(!city[code.substr(0,2)]){
    tip = "地址编码错误";
    pass = false;
  }
  else{
    //18位身份证需要验证最后一位校验位
    if(code.length == 18){
      const codes = code.split('');
      //∑(ai×Wi)(mod 11)
      //加权因子
      var factor = [ 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ];
      //校验位
      var parity = [ 1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2 ];
      var sum = 0;
      var ai = 0;
      var wi = 0;
      for (var i = 0; i < 17; i++){
          ai = parseInt(codes[i]);
          wi = factor[i];
          sum += ai * wi;
      }
      var last = parity[sum % 11];
      if(parity[sum % 11] != codes[17]){
          tip = "校验位错误";
          pass =false;
      }
    }
  }
  return pass;
};

/**
 * 身份证获得生日
 * @param ic 
 */
export function birthdayFromPid(ic:string){
  if(ic.length==15){
    return "19"+ic.substring(6, 8) + "-" + ic.substring(8, 10) + "-" + ic.substring(10, 12);
  }else
  if(ic.length==18){
    return ic.substring(6, 10) + "-" + ic.substring(10, 12) + "-" + ic.substring(12, 14);
  }
  return "";
}

/**
 * 获得性别
 * 1代表男性，0代表女性
 * @param ic 
 */
export function sexFromPid(ic:string){
  if(ic.length==15){
    return parseInt(ic[14])%2;
  }else
  if(ic.length==18){
      return parseInt(ic[16])%2;
  }else{
      return 0;
  }
}
/**
 * 身份证获得号码
 * @param identityCard 
 */
export function ageFromPid(identityCard:string) {
  //时间字符串里，必须是“/”
  var birthDate = new Date(birthdayFromPid(identityCard));
  var nowDateTime = new Date();
  var age = nowDateTime.getFullYear() - birthDate.getFullYear();
  //再考虑月、天的因素;.getMonth()获取的是从0开始的，这里进行比较，不需要加1
  if (nowDateTime.getMonth() < birthDate.getMonth() || (nowDateTime.getMonth() == birthDate.getMonth() && nowDateTime.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
};