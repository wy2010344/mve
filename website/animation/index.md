# 动画

## 信号值动画

主要是`wy-dom-helper`包里定义的`animateSignal(0)`

调用

```ts

const a=animateSignal(0)
scale.animateTo(1,tween(200,easeFns.circ));

```
其中tween是表示tween动画，参数1是时间微秒，参数2是动画曲线。
内置的有经典的tween曲线。
此外还可以用
```ts
scale.animateTo(1,spring({
  config?: {
    /**自由振荡角频率,默认8 */
    omega0?: number;
    /**阻尼比:0~1~无穷,0~1是欠阻尼,即会来回,1~无穷不会来回*/
    zta?: number;
  };
  /**初始速度 v0 (可选) */
  initialVelocity?: number;
  displacementThreshold?: number;
  velocityThreshold?: number;   
}))
```

## dom 元素动画

推荐使用`motion`库

## css 过渡动画

基于 CSS 的进入/退出动画,类似 vue 的`<Transition>`,`<TransitionGroup>`,主要是类定义命名结构与之类似,但 js 的 api 有一些不同.

## 视图切换动画

主要处理视图离场的动画,兼处理入场动画
