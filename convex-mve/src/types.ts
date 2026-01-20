/**
 * 为不同版本的 Convex 提供的类型声明和工具
 */

// 这个文件包含对 Convex API 的类型增强和工具函数

export type ConvexQueryFunction = (...args: any[]) => Promise<any>
export type ConvexMutationFunction = (...args: any[]) => Promise<any>
export type ConvexActionFunction = (...args: any[]) => Promise<any>

/**
 * 获取 Convex 函数的参数类型
 */
export type GetArgs<T extends (...args: any[]) => any> = T extends (
  args: infer P
) => any
  ? P
  : never

/**
 * 获取 Convex 函数的返回值类型
 */
export type GetResult<T extends (...args: any[]) => Promise<any>> = T extends (
  ...args: any[]
) => Promise<infer R>
  ? R
  : never

/**
 * 在 Convex 函数中提取稳定的标识符
 * 用于列表渲染时的 key
 */
export interface WithId {
  _id: string
  [key: string]: any
}

export interface WithCustomId {
  id: string
  [key: string]: any
}

export type ItemWithId = WithId | WithCustomId

/**
 * 检查对象是否有 _id 属性
 */
export function hasConvexId(item: any): item is WithId {
  return item && typeof item === 'object' && '_id' in item
}

/**
 * 获取项的 ID，适用于列表渲染
 */
export function getItemId(item: any): string {
  if (hasConvexId(item)) {
    return item._id
  } else if (item && typeof item === 'object' && 'id' in item) {
    return item.id
  }
  throw new Error('Item must have _id or id property')
}

/**
 * 分页查询配置
 */
export interface PaginationConfig {
  pageSize: number
  pageNumber: number
}

/**
 * 分页结果
 */
export interface PaginationResult<T> {
  items: T[]
  total: number
  pageSize: number
  pageNumber: number
  totalPages: number
}

/**
 * 对于分页数据的辅助类型
 */
export type ConvexPaginatedData<T> = PaginationResult<T>
