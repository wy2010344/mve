import { fdom, fsvg } from 'mve-dom';
import { createSignal } from 'wy-helper';

export function DataFlowDiagram() {
  const dataFlowSteps = [
    { id: 1, text: 'Signal 变化', color: '#ff6b6b' },
    { id: 2, text: 'trackSignal 检测', color: '#4ecdc4' },
    { id: 3, text: '响应式函数重执行', color: '#45b7d1' },
    { id: 4, text: 'DOM 更新', color: '#96ceb4' },
    { id: 5, text: 'addEffect 触发', color: '#feca57' },
  ];

  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🔄 数据流向图',
      });

      // 使用 DOM 布局，SVG 只用于连接线
      fdom.div({
        className: 'flex flex-col items-center max-w-2xl mx-auto',
        children() {
          dataFlowSteps.forEach(function (step, index) {
            // 步骤卡片
            fdom.div({
              className: 'flex items-center mb-8 w-full',
              children() {
                // 步骤圆圈
                const hover = createSignal(false);
                fdom.div({
                  className:
                    'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold cursor-pointer transition-all duration-300 mr-6',
                  s_backgroundColor: step.color,
                  s_transform() {
                    return hover.get() ? 'scale(1.1)' : 'scale(1)';
                  },
                  s_boxShadow() {
                    return hover.get() ? '0 4px 12px rgba(0,0,0,0.15)' : 'none';
                  },
                  onMouseEnter: () => hover.set(true),
                  onMouseLeave: () => hover.set(false),
                  children: step.id.toString(),
                });

                // 步骤文本
                fdom.div({
                  className:
                    'flex-1 px-4 py-3 rounded-lg border-2 transition-all duration-300',
                  s_borderColor: step.color,
                  s_backgroundColor: `${step.color}10`,
                  children() {
                    fdom.div({
                      className: 'font-semibold text-gray-800',
                      children: step.text,
                    });
                  },
                });
              },
            });

            // 连接箭头 (除了最后一个)
            if (index < dataFlowSteps.length - 1) {
              fdom.div({
                className: 'flex justify-center mb-4',
                children() {
                  fdom.div({
                    className:
                      'w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent',
                    s_borderTopColor: '#6b7280',
                  });
                },
              });
            }
          });
        },
      });
    },
  });
}
