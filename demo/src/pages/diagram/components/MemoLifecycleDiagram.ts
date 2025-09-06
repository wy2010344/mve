import { fdom, fsvg } from 'mve-dom'

export function MemoLifecycleDiagram() {
  fdom.div({
    className: 'mb-16',
    children() {
      fdom.h2({
        className: 'text-2xl font-bold mb-8 text-center',
        children: '🔄 组件渲染执行详解',
      })

      fdom.div({
        className: 'grid grid-cols-1 lg:grid-cols-2 gap-8',
        children() {
          // 左侧：memo 执行时机
          fdom.div({
            className: 'bg-white p-6 rounded-lg border border-gray-200 shadow-sm',
            children() {
              fdom.h3({
                className: 'text-lg font-bold mb-4 text-blue-600',
                children: '组件渲染时机',
              })

              fdom.div({
                className: 'space-y-4',
                children() {
                  // children() 函数执行
                  fdom.div({
                    className: 'p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-blue-800 mb-2',
                        children: 'children() 函数执行',
                      })
                      fdom.div({
                        className: 'text-sm text-blue-700',
                        children: '组件定义中的 children 函数就是在组件渲染期间执行',
                      })
                    },
                  })

                  // 组件生命周期
                  fdom.div({
                    className: 'p-4 bg-green-50 rounded-lg border-l-4 border-green-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-green-800 mb-2',
                        children: '组件生命周期管理',
                      })
                      fdom.div({
                        className: 'text-sm text-green-700',
                        children: '列表渲染中的组件创建和销毁都在组件渲染期间执行',
                      })
                    },
                  })

                  // hookDestroy 执行
                  fdom.div({
                    className: 'p-4 bg-red-50 rounded-lg border-l-4 border-red-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-red-800 mb-2',
                        children: 'hookDestroy 执行',
                      })
                      fdom.div({
                        className: 'text-sm text-red-700',
                        children: '组件销毁时，清理函数也在组件渲染期间执行',
                      })
                    },
                  })
                },
              })
            },
          })

          // 右侧：TrackSignal.addFun() 详解
          fdom.div({
            className: 'bg-white p-6 rounded-lg border border-gray-200 shadow-sm',
            children() {
              fdom.h3({
                className: 'text-lg font-bold mb-4 text-orange-600',
                children: '组件渲染过程详解',
              })

              fdom.div({
                className: 'space-y-4',
                children() {
                  // 设置当前函数
                  fdom.div({
                    className: 'p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-yellow-800 mb-2',
                        children: '1. 设置渲染环境',
                      })
                      fdom.div({
                        className: 'text-sm text-yellow-700',
                        children: '标记当前正在执行的组件，用于收集依赖关系',
                      })
                    },
                  })

                  // 执行 get 函数
                  fdom.div({
                    className: 'p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-blue-800 mb-2',
                        children: '2. 执行组件渲染',
                      })
                      fdom.div({
                        className: 'text-sm text-blue-700',
                        children: '执行组件的渲染函数，这时 children() 被调用',
                      })
                    },
                  })

                  // 处理结果
                  fdom.div({
                    className: 'p-4 bg-green-50 rounded-lg border-l-4 border-green-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-green-800 mb-2',
                        children: '3. 处理渲染结果',
                      })
                      fdom.div({
                        className: 'text-sm text-green-700',
                        children: '如果组件内容发生变化，更新组件并可能触发旧组件销毁',
                      })
                    },
                  })

                  // 清理当前函数
                  fdom.div({
                    className: 'p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400',
                    children() {
                      fdom.div({
                        className: 'font-semibold text-purple-800 mb-2',
                        children: '4. 清理渲染环境',
                      })
                      fdom.div({
                        className: 'text-sm text-purple-700',
                        children: '清理当前组件标记，完成一次组件渲染',
                      })
                    },
                  })
                },
              })
            },
          })
        },
      })

      // 底部：源码对应关系
      fdom.div({
        className: 'mt-8 bg-gray-900 text-gray-100 p-6 rounded-lg',
        children() {
          fdom.h3({
            className: 'text-lg font-bold mb-4 text-green-400',
            children: '实际执行示例',
          })

          fdom.pre({
            className: 'text-sm overflow-x-auto',
            children() {
              fdom.code({
                children: `// 当信号变化时，框架会执行以下流程：

1. 检测到信号变化
2. 找到所有依赖这个信号的组件
3. 对每个组件执行渲染过程：
   - 设置渲染环境（标记当前组件）
   - 执行组件的 children() 函数
   - 在 children() 中可能会：
     * 读取信号值（建立依赖关系）
     * 创建新的子组件
     * 销毁不需要的组件
     * 调用清理函数（hookDestroy）
   - 清理渲染环境

// 实际的组件代码示例
fdom.div({
  children() {  // ← 这个函数在组件渲染期间执行
    const data = signal.get()  // 建立依赖关系
    
    // 如果在列表渲染中，组件的创建/销毁也在这里
    renderArray(() => list.get(), (item) => {
      const element = fdom.span({ children: item.name })
      
      // 组件销毁时的清理函数
      hookDestroy(() => {
        console.log('组件被销毁了')
      })
      
      return element
    })
  }
})`,
              })
            },
          })
        },
      })
    },
  })
}