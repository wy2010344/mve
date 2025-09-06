import { fdom, fsvg } from 'mve-dom'

export function BatchSignalEndFlow() {
  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🔄 响应式更新的完整执行流程',
      })

      fdom.div({
        className: 'flex justify-center',
        children() {
          fsvg.svg({
            width: '1000',
            height: '700',
            viewBox: '0 0 1000 700',
            className: 'border border-gray-300 rounded-lg bg-white w-full max-w-6xl',
            children() {
              // 标题
              fsvg.text({
                x: '500',
                y: '30',
                textAnchor: 'middle',
                className: 'text-lg font-bold fill-gray-800',
                children: '响应式更新的循环处理机制',
              })

              // while 循环开始
              fsvg.rect({
                x: '50',
                y: '60',
                width: '900',
                height: '600',
                className: 'fill-blue-50 stroke-blue-400',
                strokeWidth: '3',
                rx: '10',
                strokeDasharray: '10,5',
              })
              fsvg.text({
                x: '70',
                y: '85',
                className: 'text-sm font-bold fill-blue-800',
                children: '持续处理更新直到完成',
              })

              // 步骤1: 交换批次
              fsvg.rect({
                x: '100',
                y: '110',
                width: '800',
                height: '60',
                className: 'fill-gray-100 stroke-gray-400',
                strokeWidth: '2',
                rx: '5',
              })
              fsvg.text({
                x: '500',
                y: '135',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-gray-800',
                children: '1. 准备处理更新',
              })
              fsvg.text({
                x: '500',
                y: '155',
                textAnchor: 'middle',
                className: 'text-xs fill-gray-700',
                children: '停止接收新的更新请求，准备处理当前批次的更新',
              })

              // 步骤2: 执行 listeners
              fsvg.rect({
                x: '100',
                y: '190',
                width: '800',
                height: '80',
                className: 'fill-yellow-50 stroke-yellow-400',
                strokeWidth: '2',
                rx: '5',
              })
              fsvg.text({
                x: '500',
                y: '215',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-yellow-800',
                children: '2. 更新受影响的组件',
              })
              fsvg.text({
                x: '500',
                y: '235',
                textAnchor: 'middle',
                className: 'text-xs fill-yellow-700',
                children: '执行所有受信号影响的组件渲染',
              })
              fsvg.text({
                x: '500',
                y: '250',
                textAnchor: 'middle',
                className: 'text-xs fill-yellow-700',
                children: '组件渲染 → children() 调用 → 可能产生新的依赖关系',
              })

              // 步骤3: 执行 deps (内部 while 循环)
              fsvg.rect({
                x: '100',
                y: '290',
                width: '800',
                height: '100',
                className: 'fill-blue-50 stroke-blue-400',
                strokeWidth: '2',
                rx: '5',
              })
              fsvg.text({
                x: '500',
                y: '315',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-blue-800',
                children: '3. 处理新产生的依赖',
              })
              fsvg.text({
                x: '500',
                y: '335',
                textAnchor: 'middle',
                className: 'text-xs fill-blue-700',
                children: '处理步骤2中新产生的组件依赖关系',
              })
              fsvg.text({
                x: '500',
                y: '350',
                textAnchor: 'middle',
                className: 'text-xs fill-blue-700',
                children: '同样执行组件渲染 → 可能产生更多依赖 → 继续内部循环',
              })
              fsvg.text({
                x: '500',
                y: '365',
                textAnchor: 'middle',
                className: 'text-xs fill-blue-700',
                children: '直到没有新的依赖产生',
              })

              // 内部 while 循环箭头
              fsvg.path({
                d: 'M 120 350 Q 80 350 80 320 Q 80 300 120 300',
                fill: 'none',
                className: 'stroke-blue-600',
                strokeWidth: '2',
                strokeDasharray: '3,3',
                markerEnd: 'url(#arrowhead-blue)',
              })

              // 步骤4: 清理工作状态
              fsvg.rect({
                x: '100',
                y: '410',
                width: '800',
                height: '40',
                className: 'fill-gray-100 stroke-gray-400',
                strokeWidth: '2',
                rx: '5',
              })
              fsvg.text({
                x: '500',
                y: '435',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-gray-800',
                children: '4. 完成组件更新阶段',
              })

              // 步骤5: 执行 effects
              fsvg.rect({
                x: '100',
                y: '470',
                width: '800',
                height: '80',
                className: 'fill-green-50 stroke-green-400',
                strokeWidth: '2',
                rx: '5',
              })
              fsvg.text({
                x: '500',
                y: '495',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-green-800',
                children: '5. 执行副作用 (按优先级排序)',
              })
              fsvg.text({
                x: '500',
                y: '515',
                textAnchor: 'middle',
                className: 'text-xs fill-green-700',
                children: '标记进入副作用执行阶段',
              })
              fsvg.text({
                x: '500',
                y: '530',
                textAnchor: 'middle',
                className: 'text-xs fill-green-700',
                children: '执行DOM更新、属性设置等副作用 → 完成副作用阶段',
              })

              // 步骤6: 检查循环条件
              fsvg.rect({
                x: '100',
                y: '570',
                width: '800',
                height: '60',
                className: 'fill-red-50 stroke-red-400',
                strokeWidth: '2',
                rx: '5',
              })
              fsvg.text({
                x: '500',
                y: '595',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-red-800',
                children: '6. 检查是否需要继续',
              })
              fsvg.text({
                x: '500',
                y: '615',
                textAnchor: 'middle',
                className: 'text-xs fill-red-700',
                children: '如果在更新过程中有新的信号变化 → 重新开始整个流程',
              })

              // 外部 while 循环箭头
              fsvg.path({
                d: 'M 920 600 Q 970 600 970 140 Q 970 100 500 100',
                fill: 'none',
                className: 'stroke-red-500',
                strokeWidth: '3',
                strokeDasharray: '5,5',
                markerEnd: 'url(#arrowhead-red)',
              })

              // 步骤间连接箭头
              fsvg.line({
                x1: '500',
                y1: '170',
                x2: '500',
                y2: '190',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              fsvg.line({
                x1: '500',
                y1: '270',
                x2: '500',
                y2: '290',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              fsvg.line({
                x1: '500',
                y1: '390',
                x2: '500',
                y2: '410',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              fsvg.line({
                x1: '500',
                y1: '450',
                x2: '500',
                y2: '470',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              fsvg.line({
                x1: '500',
                y1: '550',
                x2: '500',
                y2: '570',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              })

              // 箭头标记定义
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

                  fsvg.marker({
                    id: 'arrowhead-red',
                    markerWidth: '10',
                    markerHeight: '7',
                    refX: '9',
                    refY: '3.5',
                    orient: 'auto',
                    children() {
                      fsvg.polygon({
                        points: '0 0, 10 3.5, 0 7',
                        className: 'fill-red-500',
                      })
                    },
                  })

                  fsvg.marker({
                    id: 'arrowhead-blue',
                    markerWidth: '10',
                    markerHeight: '7',
                    refX: '9',
                    refY: '3.5',
                    orient: 'auto',
                    children() {
                      fsvg.polygon({
                        points: '0 0, 10 3.5, 0 7',
                        className: 'fill-blue-600',
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