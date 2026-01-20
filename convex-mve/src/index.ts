import { ConvexClient, ConvexHttpClient } from 'convex/browser'
import {
  createSignal,
  emptyObject,
  GetValue,
  OneSetStoreRef,
  createLateSignal,
  batchSignalEnd,
  Quote,
  PromiseResult,
  getValueOrGet,
  valueOrGetToGet,
} from 'wy-helper'
import {
  hookDestroy,
  hookTrackSignal,
  hookTrackSignalSkipFirst,
} from 'mve-helper'
import { createContext } from 'mve-core'

export interface ConvexMutationState<T = any> {
  data?: T
  isPending: boolean
  error?: Error | null
}

// ============= Context =============

const ConvexClientContext = createContext<ConvexClient | null>(null)

export function provideConvexClient(client: ConvexClient) {
  return ConvexClientContext.provide(client)
}

export function useConvexClient(): ConvexClient {
  const client = ConvexClientContext.consume()
  if (!client) {
    throw new Error(
      'useConvexClient must be used within ConvexProvider. Did you forget to wrap your app with ConvexProvider?'
    )
  }
  return client
}

// ============= Query Hook =============

/**
 * Hook for fetching data from Convex queries
 * @param query The Convex query function
 * @param args Query arguments (can be a function that returns the args)
 * @param options Optional configuration
 * @returns Object with reactive data, loading state, and error
 */
export function hookConvexQuery<
  T extends (...args: any[]) => Promise<any>,
  D = Awaited<ReturnType<T>>,
>(
  query: T,
  args: GetValue<Parameters<T>[0]> = emptyObject as Parameters<T>[0],
  options: {
    signal?: OneSetStoreRef<PromiseResult<D> | undefined>
  } = emptyObject
) {
  const client = useConvexClient()
  const signalOption =
    options?.signal || createLateSignal<PromiseResult<D> | undefined>(undefined)
  const signal = signalOption
  const getArgs = valueOrGetToGet(args)
  // Trigger new query
  const setSignal = signal.getOnlySet()
  let lastArg: any
  hookTrackSignal(getArgs, (queryArgs) => {
    const promise = client.query(query as any, queryArgs)
    lastArg = queryArgs
    function onSuccess(data: any) {
      if (queryArgs != lastArg) {
        return
      }
      setSignal({
        type: 'success',
        promise,
        value: data,
      })
    }
    function onError(error: any) {
      if (queryArgs != lastArg) {
        return
      }
      setSignal({
        type: 'error',
        promise,
        value: error,
      })
    }
    promise.then(onSuccess).catch(onError)
    return client.onUpdate(query as any, queryArgs, onSuccess, onError)
  })
  return signal.get
}

// ============= Mutation Hook =============

/**
 * Hook for executing Convex mutations
 * @param mutation The Convex mutation function
 * @param options Optional configuration
 * @returns Object with mutate function, isPending state, and error
 */
export function useConvexMutation<
  T extends (...args: any[]) => Promise<any>,
  D = Awaited<ReturnType<T>>,
>(
  mutation: T,
  options?: {
    signal?: OneSetStoreRef<ConvexMutationState<D> | undefined>
  }
) {
  const client = useConvexClient()
  const signalOption =
    options?.signal ||
    createLateSignal<ConvexMutationState<D> | undefined>({
      isPending: false,
    })
  const signal = signalOption

  const setSignal = signal.getOnlySet()

  const mutate = async (args: Parameters<T>[0]): Promise<D> => {
    setSignal({
      data: undefined,
      isPending: true,
      error: null,
    })

    try {
      const result = await client.mutation(mutation as any, args)
      setSignal({
        data: result as D,
        isPending: false,
        error: null,
      })
      batchSignalEnd()
      return result as D
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setSignal({
        data: undefined,
        isPending: false,
        error: err,
      })
      batchSignalEnd()
      throw err
    }
  }

  return {
    mutate,
    get: signal.get,
  }
}

// ============= Action Hook =============

/**
 * Hook for executing Convex actions
 * @param action The Convex action function
 * @param options Optional configuration
 * @returns Object with execute function, isPending state, and error
 */
export function useConvexAction<
  T extends (...args: any[]) => Promise<any>,
  D = Awaited<ReturnType<T>>,
>(
  action: T,
  options?: {
    signal?: OneSetStoreRef<ConvexMutationState<D> | undefined>
  }
) {
  const client = useConvexClient()
  const signalOption =
    options?.signal ||
    createLateSignal<ConvexMutationState<D> | undefined>({
      isPending: false,
    })
  const signal = signalOption

  const setSignal = signal.getOnlySet()

  const execute = async (args: Parameters<T>[0]): Promise<D> => {
    setSignal({
      data: undefined,
      isPending: true,
      error: null,
    })

    try {
      const result = await client.action(action as any, args)
      setSignal({
        data: result as D,
        isPending: false,
        error: null,
      })
      batchSignalEnd()
      return result as D
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      setSignal({
        data: undefined,
        isPending: false,
        error: err,
      })
      batchSignalEnd()
      throw err
    }
  }

  return {
    execute,
    get: signal.get,
  }
}

// ============= Exports =============

export { ConvexHttpClient } from 'convex/browser'
export type * from './types'
export * from './utils'
