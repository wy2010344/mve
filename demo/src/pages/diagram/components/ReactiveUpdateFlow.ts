import { fdom, fsvg } from 'mve-dom';

export function ReactiveUpdateFlow() {
  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '⚡ 响应式更新执行机制',
      });

      fdom.div({
        className: 'flex justify-center',
        children() {
          fsvg.svg({
            width: '900',
            height: '650',
            viewBox: '0 0 900 650',
            className:
              'border border-gray-300 rounded-lg bg-white w-full max-w-5xl',
            children() {
              // 1. 事件触发
              fsvg.rect({
                x: '50',
                y: '50',
                width: '150',
                height: '40',
                className: 'fill-red-100 stroke-red-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '125',
                y: '75',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-gray-800',
                children: '事件更新信号',
              });

              // 2. 两种进入方式的分支
              fsvg.rect({
                x: '280',
                y: '20',
                width: '140',
                height: '35',
                className: 'fill-blue-100 stroke-blue-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '350',
                y: '42',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-gray-800',
                children: 'MessageChannel 异步',
              });

              fsvg.rect({
                x: '280',
                y: '80',
                width: '140',
                height: '35',
                className: 'fill-green-100 stroke-green-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '350',
                y: '102',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-gray-800',
                children: '手动立即调用',
              });

              // 3. batchSignalEnd 统一入口
              fsvg.rect({
                x: '500',
                y: '50',
                width: '150',
                height: '40',
                className: 'fill-purple-100 stroke-purple-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '575',
                y: '75',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-gray-800',
                children: 'batchSignalEnd',
              });

              // 批量执行阶段
              fsvg.rect({
                x: '50',
                y: '150',
                width: '800',
                height: '450',
                className: 'fill-gray-50 stroke-gray-300',
                strokeWidth: '2',
                rx: '10',
              });
              fsvg.text({
                x: '450',
                y: '175',
                textAnchor: 'middle',
                className: 'text-base font-bold fill-gray-800',
                children: '批量执行阶段 (按顺序执行)',
              });

              // 步骤1: 执行受信号影响的监听
              fsvg.rect({
                x: '80',
                y: '200',
                width: '740',
                height: '100',
                className: 'fill-yellow-50 stroke-yellow-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '450',
                y: '225',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-yellow-800',
                children: '1. 执行受信号影响的监听器',
              });
              fsvg.text({
                x: '450',
                y: '245',
                textAnchor: 'middle',
                className: 'text-xs fill-yellow-700',
                children: '设置当前执行环境 → 准备依赖收集',
              });
              fsvg.text({
                x: '450',
                y: '260',
                textAnchor: 'middle',
                className: 'text-xs fill-yellow-700',
                children: '执行组件渲染函数 → 调用 children() 函数',
              });
              fsvg.text({
                x: '450',
                y: '275',
                textAnchor: 'middle',
                className: 'text-xs fill-yellow-700',
                children: '处理组件生命周期: 创建新组件 / 销毁旧组件',
              });
              fsvg.text({
                x: '450',
                y: '290',
                textAnchor: 'middle',
                className: 'text-xs fill-yellow-700',
                children: '可能产生新的依赖关系 → 进入步骤2',
              });

              // 步骤2: 执行新增加的监听
              fsvg.rect({
                x: '80',
                y: '320',
                width: '740',
                height: '80',
                className: 'fill-blue-50 stroke-blue-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '450',
                y: '345',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-blue-800',
                children: '2. 处理新增的依赖关系',
              });
              fsvg.text({
                x: '450',
                y: '365',
                textAnchor: 'middle',
                className: 'text-xs fill-blue-700',
                children: '处理步骤1中新产生的组件依赖',
              });
              fsvg.text({
                x: '450',
                y: '380',
                textAnchor: 'middle',
                className: 'text-xs fill-blue-700',
                children: '同样执行组件渲染 → 可能产生更多依赖',
              });
              fsvg.text({
                x: '450',
                y: '395',
                textAnchor: 'middle',
                className: 'text-xs fill-blue-700',
                children: '如有新依赖 → 继续处理循环',
              });

              // 步骤3: 执行Effect
              fsvg.rect({
                x: '80',
                y: '420',
                width: '740',
                height: '140',
                className: 'fill-green-50 stroke-green-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '450',
                y: '445',
                textAnchor: 'middle',
                className: 'text-sm font-bold fill-green-800',
                children: '3. 执行 Effect (按 level 层级排序)',
              });

              // Level -2: DOM 子成员结构
              fsvg.rect({
                x: '100',
                y: '460',
                width: '200',
                height: '40',
                className: 'fill-white stroke-green-500',
                strokeWidth: '1',
                rx: '3',
              });
              fsvg.text({
                x: '200',
                y: '475',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-green-800',
                children: 'Level -2',
              });
              fsvg.text({
                x: '200',
                y: '490',
                textAnchor: 'middle',
                className: 'text-xs fill-green-700',
                children: 'DOM 子成员结构',
              });

              // Level -1: DOM 属性
              fsvg.rect({
                x: '320',
                y: '460',
                width: '200',
                height: '40',
                className: 'fill-white stroke-green-500',
                strokeWidth: '1',
                rx: '3',
              });
              fsvg.text({
                x: '420',
                y: '475',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-green-800',
                children: 'Level -1',
              });
              fsvg.text({
                x: '420',
                y: '490',
                textAnchor: 'middle',
                className: 'text-xs fill-green-700',
                children: 'DOM 属性',
              });

              // Level 0+: 其他副作用
              fsvg.rect({
                x: '540',
                y: '460',
                width: '200',
                height: '40',
                className: 'fill-white stroke-green-500',
                strokeWidth: '1',
                rx: '3',
              });
              fsvg.text({
                x: '640',
                y: '475',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-green-800',
                children: 'Level 0+',
              });
              fsvg.text({
                x: '640',
                y: '490',
                textAnchor: 'middle',
                className: 'text-xs fill-green-700',
                children: '其他副作用',
              });

              // while 循环检查
              fsvg.rect({
                x: '300',
                y: '520',
                width: '300',
                height: '50',
                className: 'fill-red-50 stroke-red-400',
                strokeWidth: '2',
                rx: '5',
              });
              fsvg.text({
                x: '450',
                y: '540',
                textAnchor: 'middle',
                className: 'text-xs font-bold fill-red-800',
                children: '检查是否需要重复执行',
              });
              fsvg.text({
                x: '450',
                y: '555',
                textAnchor: 'middle',
                className: 'text-xs fill-red-700',
                children: '如有新的信号变化 → 重新开始整个流程',
              });

              // 连接线 - 事件到分支
              fsvg.line({
                x1: '200',
                y1: '70',
                x2: '280',
                y2: '37',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              fsvg.line({
                x1: '200',
                y1: '70',
                x2: '280',
                y2: '97',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              // 分支到统一入口
              fsvg.line({
                x1: '420',
                y1: '37',
                x2: '500',
                y2: '60',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              fsvg.line({
                x1: '420',
                y1: '97',
                x2: '500',
                y2: '80',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              // 进入批量执行
              fsvg.line({
                x1: '575',
                y1: '90',
                x2: '575',
                y2: '150',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              // 步骤间连接
              fsvg.line({
                x1: '450',
                y1: '300',
                x2: '450',
                y2: '320',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              fsvg.line({
                x1: '450',
                y1: '400',
                x2: '450',
                y2: '420',
                className: 'stroke-gray-600',
                strokeWidth: '2',
                markerEnd: 'url(#arrowhead)',
              });

              // 步骤1和2之间的循环箭头 (表示可能的循环)
              fsvg.path({
                d: 'M 80 360 Q 30 360 30 260 Q 30 220 80 220',
                fill: 'none',
                className: 'stroke-orange-500',
                strokeWidth: '2',
                strokeDasharray: '3,3',
                markerEnd: 'url(#arrowhead-orange)',
              });

              // while 循环箭头
              fsvg.path({
                d: 'M 600 545 Q 750 545 750 260 Q 750 220 450 220',
                fill: 'none',
                className: 'stroke-red-500',
                strokeWidth: '2',
                strokeDasharray: '5,5',
                markerEnd: 'url(#arrowhead-red)',
              });

              // MessageChannel 说明
              fsvg.text({
                x: '350',
                y: '15',
                textAnchor: 'middle',
                className: 'text-xs fill-gray-600',
                children: '异步调用 batchSignalEnd',
              });

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
                      });
                    },
                  });

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
                      });
                    },
                  });

                  fsvg.marker({
                    id: 'arrowhead-orange',
                    markerWidth: '10',
                    markerHeight: '7',
                    refX: '9',
                    refY: '3.5',
                    orient: 'auto',
                    children() {
                      fsvg.polygon({
                        points: '0 0, 10 3.5, 0 7',
                        className: 'fill-orange-500',
                      });
                    },
                  });
                },
              });
            },
          });
        },
      });
    },
  });
}
