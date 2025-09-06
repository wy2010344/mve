import { fdom } from 'mve-dom'

export function DomApiComparison() {
  const domApis = [
    {
      name: 'dom.xx',
      style: '链式调用',
      color: '#ff6b6b',
      features: ['符合 DOM 结构', '链式调用风格', '直观易懂'],
    },
    {
      name: 'fdom.xx',
      style: '扁平参数',
      color: '#4ecdc4',
      features: ['推荐使用', '扁平参数风格', '简洁高效'],
    },
    {
      name: 'mdom.xx',
      style: '减少依赖',
      color: '#45b7d1',
      features: ['性能优化', '减少 trackSignal', '高级用法'],
    },
  ]

  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🎨 三套 DOM API 对比',
      })

      fdom.div({
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
        children() {
          domApis.forEach((api) => {
            fdom.div({
              className: 'border-2 rounded-lg bg-white overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl',
              s_borderColor: api.color,
              children() {
                // API 头部
                fdom.div({
                  className: 'p-4 flex justify-between items-center',
                  s_backgroundColor: api.color + '20',
                  children() {
                    fdom.h3({
                      className: 'text-xl font-bold m-0',
                      s_color: api.color,
                      children: api.name,
                    })

                    fdom.span({
                      className: 'text-sm text-gray-600 italic',
                      children: api.style,
                    })
                  },
                })

                // API 特性
                fdom.div({
                  className: 'p-4',
                  children() {
                    api.features.forEach((feature) => {
                      fdom.div({
                        className: 'flex items-center mb-2 text-sm',
                        children() {
                          fdom.span({
                            className: 'w-2 h-2 rounded-full mr-2',
                            s_backgroundColor: api.color,
                          })

                          fdom.span({
                            children: feature,
                          })
                        },
                      })
                    })
                  },
                })
              },
            })
          })
        },
      })
    },
  })
}