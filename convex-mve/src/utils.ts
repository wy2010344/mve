/**
 * Convex-MVE 实用工具和辅助函数
 */

import { GetValue } from 'wy-helper'
import { hookTrackSignal } from 'mve-helper'
import { hookConvexQuery } from './index'

/**
 * 缓存查询结果以避免重复请求
 * 用于当多个组件需要相同的数据时
 */
export function createCachedConvexQuery<
  T extends (...args: any[]) => Promise<any>,
>(query: T, getCacheKey?: (args: Parameters<T>[0]) => string) {
  const cache = new Map<string, any>()

  return (args?: GetValue<Parameters<T>[0]>, options?: any) => {
    const argsValue = typeof args === 'function' ? args() : args
    const cacheKey = getCacheKey
      ? getCacheKey(argsValue)
      : JSON.stringify(argsValue)

    // 如果已缓存，返回缓存结果
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey)
    }

    // 否则创建新的查询
    const getter = hookConvexQuery(query, args, options)
    cache.set(cacheKey, getter)

    return getter
  }
}

/**
 * 为查询结果添加本地更新乐观更新
 * 在网络请求完成前立即更新 UI
 */
export function useOptimisticUpdate<T>(
  currentGetter: () => any,
  updateFunction: (current: T) => T
) {
  return function applyOptimisticUpdate() {
    const current = currentGetter()
    if (current?.data) {
      return {
        ...current,
        data: updateFunction(current.data),
      }
    }
    return current
  }
}

/**
 * 重试失败的查询
 * 用于处理临时网络错误
 */
export async function retryQuery<T extends (...args: any[]) => Promise<any>>(
  queryFn: T,
  args: Parameters<T>[0],
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<Awaited<ReturnType<T>>> {
  let lastError: Error | undefined

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn(args)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < maxRetries - 1) {
        // 指数退避
        await new Promise((resolve) =>
          setTimeout(resolve, delayMs * Math.pow(2, i))
        )
      }
    }
  }

  throw lastError
}

/**
 * 批量查询多个数据
 * 将多个查询并行执行，返回合并的结果
 */
export function useBatchQueries<
  Q extends Record<string, (...args: any[]) => Promise<any>>,
>(
  queries: Q,
  getArgs?: (key: keyof Q) => any
): () => {
  data: Record<keyof Q, any>
  isLoading: boolean
  errors: Record<keyof Q, Error | null>
} {
  const results = {} as Record<keyof Q, any>
  const isLoading = { value: true }
  const errors = {} as Record<keyof Q, Error | null>

  // 执行所有查询
  for (const key in queries) {
    const query = queries[key]
    const args = getArgs ? getArgs(key) : undefined

    const getter = hookConvexQuery(query, args)

    // 跟踪结果变化
    hookTrackSignal(() => {
      const result = getter()
      results[key] = result?.data
      errors[key] = result?.error || null
      isLoading.value = Object.values(results).some((r) => r === undefined)
    })
  }

  return () => ({
    data: results,
    isLoading: isLoading.value,
    errors,
  })
}

/**
 * 去抖动查询参数变化
 * 防止参数频繁变化导致过多请求
 */
export function useDebouncedQuery<T extends (...args: any[]) => Promise<any>>(
  query: T,
  getDebouncedArgs: GetValue<Parameters<T>[0]>,
  delayMs: number = 300
) {
  let timeoutId: any
  let pendingArgs: Parameters<T>[0] | undefined

  const finalArgs = { value: undefined as Parameters<T>[0] | undefined }

  hookTrackSignal(
    () => {
      const args =
        typeof getDebouncedArgs === 'function'
          ? getDebouncedArgs()
          : getDebouncedArgs
      return JSON.stringify(args)
    },
    () => {
      const args =
        typeof getDebouncedArgs === 'function'
          ? getDebouncedArgs()
          : getDebouncedArgs

      pendingArgs = args

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        finalArgs.value = pendingArgs
      }, delayMs)
    }
  )

  return hookConvexQuery(
    query,
    () => finalArgs.value || ({} as Parameters<T>[0])
  )
}

/**
 * 合并多个查询结果的数据
 * 用于需要组合来自不同 API 的数据
 */
export function mergeQueryResults<T extends Record<string, any>>(
  ...results: Array<() => any>
): () => {
  data: T
  isLoading: boolean
  error?: Error
} {
  return () => {
    const data = {} as T
    let isLoading = false
    let error: Error | undefined

    for (const getter of results) {
      const result = getter()
      if (!result) continue

      if (result.isLoading) {
        isLoading = true
      }
      if (result.error) {
        error = result.error
      }
      if (result.data) {
        Object.assign(data, result.data)
      }
    }

    return { data, isLoading, error }
  }
}

/**
 * 将查询结果转换为另一种格式
 * 用于数据转换和规范化
 */
export function useTransformedQuery<
  T extends (...args: any[]) => Promise<any>,
  R,
>(
  query: T,
  args?: GetValue<Parameters<T>[0]>,
  transform?: (data: Awaited<ReturnType<T>>) => R
) {
  const getOriginal = hookConvexQuery(query, args)

  return () => {
    const result = getOriginal()
    if (!result) return result

    return {
      ...result,
      data: result.data
        ? transform
          ? transform(result.data)
          : result.data
        : undefined,
    }
  }
}
