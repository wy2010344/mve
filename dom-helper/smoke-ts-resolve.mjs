/**
 * ESM 解析钩子：让 node 能直接 import demo 的 TS 模块（vite 风格的无扩展名相对导入）。
 * 仅用于 smoke-canvas-render-todo.mjs，不参与构建产物。
 */
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (specifier.startsWith('.') || specifier.startsWith('file:')) {
      for (const suffix of ['.ts', '/index.ts']) {
        try {
          return await nextResolve(specifier + suffix, context);
        } catch {
          // 试下一个后缀
        }
      }
    }
    throw err;
  }
}
