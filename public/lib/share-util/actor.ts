



/**
 * 我觉得这样应该够了
 * 指导同步线程中一部分操作
 * 也许不应该有后一步操作，分门别类，自动处理，全局规划
 * 并发在这个角色这一处肯定是顺序同步执行的，先后不一定。而且确定了同步执行获得数据之后的部分动作（灵活）
 * 如果这个角色什么也不做，只排队执行这个每个线程自定义的动作，比如sql操作，如银行排队办理自定义业务到下一个。
 * 在Java的monitor中，如果排队只受理业务，可以考虑无排队先进List，再循环从List中取。只锁队列的访问。
 */
export class Actor<T,V>{
	constructor(
		private process:(data:T,after:(v:V)=>void)=>void
	){}

	//需要允许多线程
	private sleep=true
	private tasks:[T,(v:V)=>void][]=[]

	//消费者
	private run(){
		const that=this
		if(this.tasks.length){
			const [data,after]=this.tasks.shift()
			this.process(data,function(result){
				after(result)
				that.run()
			})
		}else{
			this.sleep=true
		}
	}
	//生产者。外部线程执行，但锁内部的tasks\sleep，需要在这之上排队。
	//通知这个actor工作，是这个actor自己的单线程，会一直工作到结束。
	//
	push(data:T,after:(result:V)=>void){
		this.tasks.push([data,after])
		if(this.sleep){
			this.sleep=false
			this.run()
		}
	}
}