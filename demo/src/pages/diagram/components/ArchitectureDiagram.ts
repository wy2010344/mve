import { fdom, mdom, fsvg } from 'mve-dom'
import { createSignal } from 'wy-helper'
import { renderOne } from 'mve-helper'

export function ArchitectureDiagram() {
  const selectedLayer = createSignal('core')
  const hoveredComponent = createSignal<string | null>(null)

  const architectureLayers = [
    {
      id: 'helper',
      name: 'wy-helper',
      title: '核心响应式系统',
      color: '#ff6b6b',
      components: ['createSignal', 'memo', 'trackSignal', 'addEffect'],
    },
    {
      id: 'core',
      name: 'mve-core',
      title: '核心渲染系统',
      color: '#4ecdc4',
      components: ['stateHolder', 'Context', 'renderForEach'],
    },
    {
      id: 'helper-layer',
      name: 'mve-helper',
      title: '辅助工具层',
      color: '#45b7d1',
      components: ['renderIf', 'renderOne', 'renderArray', 'hookPromise'],
    },
    {
      id: 'dom',
      name: 'mve-dom',
      title: 'DOM 桥接层',
      color: '#96ceb4',
      components: ['dom.xx', 'fdom.xx', 'mdom.xx'],
    },
  ]

  function getComponentDescription(component: string) {
    const descriptions: Record<string, string> = {
      createSignal: '创建原子响应式信号',
      memo: '智能计算属性，自动依赖追踪',
      trackSignal: '建立响应式依赖关系',
      addEffect: '批量副作用处理',
      stateHolder: '组件生命周期管理',
      Context: '跨组件数据传递',
      renderForEach: '基础列表渲染原语',
      renderIf: '条件渲染辅助函数',
      renderOne: '单值渲染辅助函数',
      renderArray: '简单列表渲染',
      hookPromise: '异步状态管理',
      'dom.xx': '链式调用 DOM API',
      'fdom.xx': '扁平参数 DOM API',
      'mdom.xx': '性能优化 DOM API',
    }
    return descriptions[component] || '核心功能组件'
  }

  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🏗️ 整体架构层次图',
      })

      // 层次选择器
      fdom.div({
        className: 'flex gap-4 mb-8 justify-center flex-wrap',
        children() {
          architectureLayers.forEach((layer) => {
            const hover = createSignal(false)
            mdom.button({
              attrs(m) {
                const selected = selectedLayer.get() === layer.id
                const isHover = hover.get()
                
                m.className = `px-4 py-2 border-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  selected
                    ? 'text-white shadow-lg'
                    : 'bg-white hover:shadow-md hover:-translate-y-1'
                }`
                m.s_borderColor = layer.color
                m.s_backgroundColor = selected ? layer.color : 'white'
                m.s_color = selected ? 'white' : layer.color
                
                if (isHover && !selected) {
                  m.s_transform = 'translateY(-2px)'
                  m.s_boxShadow = '0 4px 8px rgba(0,0,0,0.1)'
                }
              },
              onClick: () => selectedLayer.set(layer.id),
              onMouseEnter: () => hover.set(true),
              onMouseLeave: () => hover.set(false),
              children: layer.name,
            })
          })
        },
      })

      // SVG 架构图
      fdom.div({
        className: 'flex justify-center mb-8',
        children() {
          fsvg.svg({
            width: '800',
            height: '500',
            viewBox: '0 0 800 500',
            className: 'w-full max-w-4xl border border-gray-300 rounded-lg bg-white',
            children() {
              // 背景框架
              fsvg.rect({
                x: '50',
                y: '50',
                width: '700',
                height: '400',
                className: 'fill-none stroke-gray-300',
                strokeWidth: '2',
                rx: '10',
              })

              fsvg.text({
                x: '400',
                y: '40',
                textAnchor: 'middle',
                className: 'text-lg font-bold fill-gray-800',
                children: 'MVE 框架架构',
              })

              // 架构层次
              architectureLayers.forEach(function (layer, index) {
                fsvg.g({
                  children() {
                    // 层次背景
                    fsvg.rect({
                      x: '70',
                      y: () => (80 + index * 90).toString(),
                      width: '660',
                      height: '70',
                      fill() {
                        return selectedLayer.get() === layer.id
                          ? layer.color + '20'
                          : '#f8f9fa'
                      },
                      stroke: layer.color,
                      strokeWidth() {
                        return selectedLayer.get() === layer.id ? '3' : '1'
                      },
                      rx: '5',
                      className: 'cursor-pointer',
                      onClick: () => selectedLayer.set(layer.id),
                    })

                    // 层次标题
                    fsvg.text({
                      x: '90',
                      y: () => (105 + index * 90).toString(),
                      className: 'text-sm font-bold',
                      fill: layer.color,
                      children: `${layer.title} (${layer.name})`,
                    })

                    // 组件列表
                    layer.components.forEach(function (component, compIndex) {
                      fsvg.g({
                        children() {
                          fsvg.rect({
                            x: () => (90 + compIndex * 150).toString(),
                            y: () => (115 + index * 90).toString(),
                            width: '140',
                            height: '25',
                            fill() {
                              return hoveredComponent.get() === component
                                ? layer.color + '40'
                                : layer.color + '10'
                            },
                            stroke: layer.color,
                            strokeWidth: '1',
                            rx: '3',
                            onMouseEnter: () => hoveredComponent.set(component),
                            onMouseLeave: () => hoveredComponent.set(null),
                          })

                          fsvg.text({
                            x: () => (160 + compIndex * 150).toString(),
                            y: () => (132 + index * 90).toString(),
                            textAnchor: 'middle',
                            className: 'text-xs fill-gray-800',
                            children: component,
                          })
                        },
                      })
                    })

                    // 连接线
                    if (index < architectureLayers.length - 1) {
                      fsvg.line({
                        x1: '400',
                        y1: () => (150 + index * 90).toString(),
                        x2: '400',
                        y2: () => (170 + index * 90).toString(),
                        stroke: layer.color,
                        strokeWidth: '2',
                        markerEnd: 'url(#arrowhead)',
                      })
                    }
                  },
                })
              })

              // 箭头标记
              fsvg.defs({
                children() {
                  fsvg.marker({
                    id: 'arrowhead',
                    markerWidth: '10',
                    markerHeight: '7',
                    refX: '9',
                    refY: '3.5',
                    orient: 'auto',
                    children() {
                      fsvg.polygon({
                        points: '0 0, 10 3.5, 0 7',
                        className: 'fill-gray-600',
                      })
                    },
                  })
                },
              })
            },
          })
        },
      })

      // 选中层次的详细信息
      renderOne(selectedLayer.get, function () {
        const currentLayer = architectureLayers.find(
          (l) => l.id === selectedLayer.get()
        )
        if (!currentLayer) return

        fdom.div({
          className: 'p-6 bg-white rounded-lg border border-gray-200 shadow-sm',
          children() {
            fdom.h3({
              className: 'text-xl font-bold mb-4',
              s_color: currentLayer.color,
              children: currentLayer.title,
            })

            fdom.div({
              className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
              children() {
                currentLayer.components.forEach(function (component) {
                  fdom.div({
                    className: 'p-4 border border-gray-200 rounded-lg bg-gray-50 hover:shadow-md transition-shadow',
                    children() {
                      fdom.div({
                        className: 'font-bold mb-2',
                        s_color: currentLayer.color,
                        children: component,
                      })

                      fdom.div({
                        className: 'text-sm text-gray-600',
                        children: getComponentDescription(component),
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
}