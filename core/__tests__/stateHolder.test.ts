import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { batchSignalEnd, createSignal } from 'wy-helper'
import { addTrackEffect, createContext, renderForEach } from '../src/index'
import { createTestRoot } from './harness'

// 复位全局信号缓存,避免用例之间互相影响
beforeEach(() => {
  const key = 'wy-helper-signal-cache'
  const cache = (globalThis as any)[key]
  if (cache) {
    cache.beginBatch = false
    cache.currentBatch = { listeners: new Set(), effects: new Map(), deps: [] }
    cache.nextBatch = { listeners: new Set(), effects: new Map(), deps: [] }
    cache.onWorkBatch = undefined
    cache.onEffectRun = undefined
    cache.currentFun = undefined
    cache.currentRelay = undefined
    cache.callGet = false
    cache.memoStack = []
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('StateHolder 生命周期', () => {
  it('嵌套 renderNode 销毁时先子后父,只清理一次', () => {
    const events: string[] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const root = createTestRoot(function () {
      this.addNode('root')
      this.addDestroy(() => events.push('root-destroy'))
      this.renderNode('child', function () {
        this.addNode('child')
        this.addDestroy(() => events.push('child-destroy'))
        this.renderNode('grand', function () {
          this.addNode('grand')
          this.addDestroy(() => events.push('grand-destroy'))
        })
      })
    })

    expect(root.target()).toEqual(['root'])

    root.destroy()
    expect(events).toEqual(['grand-destroy', 'child-destroy', 'root-destroy'])
    // 父子关系已在 destroy 时摘除,不应出现 duplicate destroy
    expect(warn).not.toHaveBeenCalled()
  })

  it('renderForEach 删除 key 后旧 holder 被销毁,根销毁不重复清理', () => {
    const events: string[] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const list = createSignal([1, 2, 3])

    const root = createTestRoot(function () {
      renderForEach<number, number>(
        callback => {
          list.get().forEach(v => callback(v, v))
        },
        function (key) {
          this.addNode('item-' + key)
          this.renderNode('sub-' + key, function () {
            this.addDestroy(() => events.push('sub-destroy-' + key))
          })
          this.addDestroy(() => events.push('destroy-' + key))
        }
      )
    })

    expect(root.target()).toEqual(['item-1', 'item-2', 'item-3'])

    // 删除 key 1:旧的 EachValue 及其子节点应立即销毁
    list.set([2, 3])
    batchSignalEnd()
    expect(root.target()).toEqual(['item-2', 'item-3'])
    expect(events).toEqual(['sub-destroy-1', 'destroy-1'])

    // 根销毁只应清理仍存活的 key:2、3
    events.length = 0
    root.destroy()
    expect(events.sort()).toEqual([
      'destroy-2',
      'destroy-3',
      'sub-destroy-2',
      'sub-destroy-3',
    ])
    expect(warn).not.toHaveBeenCalled()
  })
})

describe('Context', () => {
  it('能提供 falsy 值,且子级 provide 不影响兄弟节点', () => {
    const ctx = createContext<number | boolean | null>(0)
    const got: (number | boolean | null)[] = []

    createTestRoot(function () {
      ctx.provide(0)
      got.push(ctx.consume())
      this.renderNode('child', function () {
        ctx.provide(false)
        got.push(ctx.consume())
      })
      this.renderNode('other', function () {
        got.push(ctx.consume())
      })
    })

    // 0 与 false 都必须按显式 provide 的值返回,兄弟节点仍读父级的值
    expect(got).toEqual([0, false, 0])
  })

  it('显式 provide undefined 时不会被默认值覆盖', () => {
    const ctx = createContext<number | undefined>(1)
    let got: number | undefined = 1

    createTestRoot(function () {
      ctx.provide(undefined)
      got = ctx.consume()
    })

    expect(got).toBeUndefined()
  })
})

describe('effect 与销毁', () => {
  it('根销毁后信号更新不再触发 effect', () => {
    const s = createSignal(0)
    const seen: number[] = []

    const root = createTestRoot(function () {
      addTrackEffect(
        () => s.get(),
        v => {
          seen.push(v)
          return () => {}
        }
      )
    })

    batchSignalEnd()
    expect(seen).toEqual([0])

    s.set(1)
    batchSignalEnd()
    expect(seen).toEqual([0, 1])

    root.destroy()
    s.set(2)
    batchSignalEnd()
    expect(seen).toEqual([0, 1])
  })
})
