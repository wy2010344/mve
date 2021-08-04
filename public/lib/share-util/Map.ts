

export class Map<K,V>{
	private kvs:[K,V][]=[]
	private getKVIndex(k:K){
		return this.kvs.findIndex(kv=>kv[0]==k)
	}
	private getKV(k:K){
		return this.kvs.find(kv=>kv[0]==k)
	}
	set(k:K,v:V){
		const kv=this.getKV(k)
		if(kv){
			kv[1]=v
		}else{
			this.kvs.push([k,v])
		}
	}
	get(k:K):V|undefined{
		const kv=this.getKV(k)
		if(kv){
			return kv[1]
		}
	}
	getOr<M>(k:K,def:M):V|M{
		const kv=this.getKV(k)
		if(kv){
			return kv[1]
		}else{
			return def
		}
	}
	clear(){
		this.kvs.length=0
	}
	size(){
		return this.kvs.length
	}
	delete(k:K){
		const idx=this.getKVIndex(k)
		if(idx>-1){
			this.kvs.splice(idx,1)
		}
	}
	has(k:K){
		return this.getKVIndex(k)>-1
	}
	keys(){
		return this.kvs.map(kv=>kv[0])
	}
	values(){
		return this.kvs.map(kv=>kv[1])
	}
	forEach(fun:(v:V,k:K)=>void){
		this.kvs.forEach(kv=>fun(kv[1],kv[0]))
	}
}

export function stackLess<V>(call:(v:V)=>void,init:(append:(v:V)=>void)=>void) {
	const stack:V[]=[]
	init(function(v){
		stack.push(v)
	})
	while(stack.length>0){
		const first=stack.pop()
		call(first)
	}
}