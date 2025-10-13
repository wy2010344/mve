import { fdom, zdom } from 'mve-dom';
import { createSignal } from 'wy-helper';
import { renderIf } from 'mve-helper';

export function LifecycleAnimation() {
  const currentLifecycleStep = createSignal(0);
  const isPlaying = createSignal(false);

  const lifecycleSteps = [
    { name: '组件创建', color: '#ff6b6b', active: createSignal(false) },
    { name: 'Signal 初始化', color: '#4ecdc4', active: createSignal(false) },
    { name: 'DOM 创建', color: '#45b7d1', active: createSignal(false) },
    { name: '副作用注册', color: '#96ceb4', active: createSignal(false) },
    { name: '响应式更新', color: '#feca57', active: createSignal(false) },
    { name: '组件销毁', color: '#ff9ff3', active: createSignal(false) },
  ];

  function playLifecycleAnimation() {
    if (isPlaying.get()) return;

    isPlaying.set(true);
    currentLifecycleStep.set(0);

    const playStep = () => {
      const step = currentLifecycleStep.get();
      if (step < lifecycleSteps.length) {
        lifecycleSteps[step].active.set(true);
        currentLifecycleStep.set(step + 1);
        setTimeout(playStep, 800);
      } else {
        setTimeout(() => {
          lifecycleSteps.forEach(step => step.active.set(false));
          isPlaying.set(false);
        }, 1000);
      }
    };

    playStep();
  }

  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🔄 组件生命周期动画',
      });

      fdom.div({
        className: 'p-8 bg-gray-50 rounded-lg border border-gray-200',
        children() {
          // 播放按钮
          fdom.div({
            className: 'text-center mb-8',
            children() {
              const hover = createSignal(false);
              zdom.button({
                attrs(m) {
                  const playing = isPlaying.get();
                  const isHover = hover.get();

                  m.className =
                    'px-6 py-3 text-white border-none rounded-lg text-base transition-all duration-300';

                  if (playing) {
                    m.s_backgroundColor = '#9ca3af';
                    m.s_cursor = 'not-allowed';
                  } else if (isHover) {
                    m.s_backgroundColor = '#2563eb';
                    m.s_transform = 'translateY(-4px)';
                    m.s_boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
                  } else {
                    m.s_backgroundColor = '#3b82f6';
                    m.s_transform = 'translateY(0)';
                    m.s_boxShadow = 'none';
                  }
                },
                onClick: playLifecycleAnimation,
                onMouseEnter() {
                  if (!isPlaying.get()) hover.set(true);
                },
                onMouseLeave() {
                  hover.set(false);
                },
                childrenType: 'text',
                children() {
                  return isPlaying.get() ? '播放中...' : '播放生命周期';
                },
              });
            },
          });

          // 生命周期步骤
          fdom.div({
            className: 'flex justify-between items-center relative',
            children() {
              lifecycleSteps.forEach(function (step, index) {
                fdom.div({
                  className: 'flex flex-col items-center relative flex-1',
                  children() {
                    // 步骤圆圈
                    zdom.div({
                      attrs(m) {
                        const active = step.active.get();
                        m.className =
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-500 mb-2';
                        m.s_backgroundColor = active ? step.color : '#e5e7eb';
                        m.s_transform = active ? 'scale(1.25)' : 'scale(1)';
                      },
                      children: (index + 1).toString(),
                    });

                    // 步骤名称
                    zdom.div({
                      attrs(m) {
                        const active = step.active.get();
                        m.className =
                          'text-sm text-center transition-all duration-300';
                        m.s_color = active ? '#1f2937' : '#6b7280';
                        m.s_fontWeight = active ? 'bold' : 'normal';
                      },
                      children: step.name,
                    });

                    // 连接箭头
                    renderIf(
                      () => index < lifecycleSteps.length - 1,
                      () => {
                        zdom.div({
                          attrs(m) {
                            const color = step.active.get()
                              ? '#6b7280'
                              : '#e5e7eb';
                            m.className =
                              'absolute top-5 -right-1/2 w-0 h-0 transition-all duration-300';
                            m.s_borderTop = '5px solid transparent';
                            m.s_borderBottom = '5px solid transparent';
                            m.s_borderLeft = `10px solid ${color}`;
                          },
                        });
                      }
                    );
                  },
                });
              });
            },
          });
        },
      });
    },
  });
}
