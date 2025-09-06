import { fdom, fsvg } from 'mve-dom'

export function SignalSystemDiagram() {
  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🔧 Signal 系统详细图',
      })

      fdom.div({
        className: 'flex justify-center',
        children() {
          fsvg.svg({
            width: '700',
            height: '400',
            viewBox: '0 0 700 400',
            className: 'border border-gray-300 rounded-lg bg-white w-full max-w-4xl',
            children() {
              // Signal 创建
              fsvg.rect({
                x: '50',
                y: '50',
                width: '200',
                height: '60',
                className: 'fill-red-100 stroke-red-400',
                strokeWidth: '2',
                rx: '5',
              })

              fsvg.text({
                x: '150',
                y: '75',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-gray-800',
                children: 'createSignal(value)',
              })

              fsvg.text({
                x: '150',
                y: '95',
                textAnchor: 'middle',
                className: 'text-xs fill-gray-600',
                children: '创建响应式信号',
              })

              // Signal 对象
              fsvg.rect({
                x: '300',
                y: '50',
                width: '150',
                height: '100',
                className: 'fill-blue-100 stroke-blue-400',
                strokeWidth: '2',
                rx: '5',
              })

              fsvg.text({
                x: '375',
                y: '75',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-gray-800',
                children: 'Signal 对象',
              })

              const methods = ['get() 方法', 'set() 方法', '观察者列表', '变更通知']
              methods.forEach((text, index) => {
                fsvg.text({
                  x: '375',
                  y: () => (95 + index * 15).toString(),
                  textAnchor: 'middle',
                  className: 'text-xs fill-gray-600',
                  children: text,
                })
              })

              // 解包使用
              fsvg.rect({
                x: '500',
                y: '50',
                width: '150',
                height: '60',
                className: 'fill-green-100 stroke-green-400',
                strokeWidth: '2',
                rx: '5',
              })

              fsvg.text({
                x: '575',
                y: '75',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-gray-800',
                children: '解包使用',
              })

              fsvg.text({
                x: '575',
                y: '95',
                textAnchor: 'middle',
                className: 'text-xs fill-gray-600',
                children: 'const { get, set }',
              })

              // 特点说明
              fsvg.rect({
                x: '200',
                y: '200',
                width: '300',
                height: '120',
                className: 'fill-purple-100 stroke-purple-400',
                strokeWidth: '2',
                rx: '5',
              })

              fsvg.text({
                x: '350',
                y: '225',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-gray-800',
                children: '原子性特点',
              })

              const features = [
                '• 不是嵌套响应式',
                '• 对象需整体替换',
                '• 可手动嵌套优化',
                '• 细粒度更新控制',
              ]
              features.forEach((text, index) => {
                fsvg.text({
                  x: '350',
                  y: () => (250 + index * 20).toString(),
                  textAnchor: 'middle',
                  className: 'text-xs fill-gray-800',
                  children: text,
                })
              })

              // 连接线
              fsvg.line({
                x1: '250',
                y1: '80',
                x2: '300',
                y2: '80',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              fsvg.line({
                x1: '450',
                y1: '100',
                x2: '500',
                y2: '100',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              fsvg.line({
                x1: '375',
                y1: '150',
                x2: '350',
                y2: '200',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
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
    },
  })
}