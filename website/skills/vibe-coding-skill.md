# Vibe Coding Skill for MVE

## Metadata

- name: vibe-coding
- platform: mve
- scope: docs/skill
- version: 1.0.0
- author: AI助手
- description: "基于 packages/mve/website/core 文档的交互式编程 skill，提供清晰模板、最佳实践与语法提示。"
- tags: [mve, signal, fdom, zdom, render, hooks, lifecycle]

## Intent

- 生成 `MVE` 速成代码片段
- 解释 `createSignal/memo/hookTrackSignal/addEffect` 用法
- 构建 `fdom/zdom` 组件模板
- 配置列表渲染（renderArrayKey 等）、条件渲染 (`renderIf`)
- 编写生命周期与 `hookDestroy` 模式

## Trigger（触发词）

- `mve: vibe coding`
- `mve: create component`
- `mve: render list`
- `mve: signal based ui`

## Input schema

```json
{
  "type": "object",
  "properties": {
    "goal": {
      "type": "string",
      "description": "你想达成的目标，例如'创建todo列表'、'计时器组件'"
    },
    "framework": {
      "type": "string",
      "enum": ["fdom", "zdom", "dom"],
      "default": "fdom"
    },
    "mode": {
      "type": "string",
      "enum": ["quick", "detailed"],
      "default": "detailed"
    },
    "autoCleanup": { "type": "boolean", "default": true }
  },
  "required": ["goal"]
}
```

## Output schema

```json
{
  "type": "object",
  "properties": {
    "description": { "type": "string" },
    "code": { "type": "string" },
    "notes": { "type": "string" }
  },
  "required": ["code"]
}
```

## Behavior

1. 解析 `goal`，判断目标场景：
   - `todo` / `list`: renderArrayKey + fdom
   - `timer`: signal + addEffect + hookDestroy
   - `form` / `input`: two-way-bind 信号 + effect
2. 输出 TS 示例，包含 import、组件函数、挂载（假定已在宿主中调用）
3. `mode: quick` 仅生成核心片段；`mode: detailed` 生成含注释与进阶提示

## Example prompt

```text
请帮我生成一个 MVE 组件，目标：todo 列表。framework=fdom，mode=detailed。
```

## Example output

```md
description: "Todo 列表组件"
code: "import { createSignal, memo, hookTrackSignal, addEffect, hookDestroy } from 'mve-core';\nimport { fdom, renderArrayKey, renderIf } from 'mve-dom';\n\nfunction TodoApp() { ... }"
notes: "todo: 处理 id 唯一性，支持编辑与完成状态"
```

## Best practice rules

- 对象信号更新需不 mutate，优先 `set({...old, prop: newVal})`
- 复杂状态用 `memo` 缓存变换结果
- 事件内更新 signal 写在 `addEffect`/`hookTrackSignal` 中避免同步循环副作用
- 列表请使用 `renderArrayKey`，并确保 key 稳定

## Lint

- `mve` 名称空间统一引入：`import { createSignal } from 'wy-helper'` 或 `mve-core`
- `fdom`/`zdom` 场景规范， `dom` 作为兼容不过期

## Extension points / TODO

- 生成 `vibe-coding.ts` Helper 模块（封装函数生成代码/entry）
- 指南补充：SSR、数据预取、按键导航、可访问性 a11y
- 加入 VSCode snippet: `packages/mve/website/skills/vibe-coding.code-snippets.json`

## Implementation

- 实现脚本: `vibe-coding-skill.ts` (同目录下)
- 运行方式: `node vibe-coding-skill.ts` (测试示例)
- 集成: 可导入 `generateVibeCode` 函数到其他工具中

## 验证方式

1. 手动复制 `code` 到 `packages/mve/website` 某个 demo 运行
2. 断言：`createSignal` value 随按钮生效，`hookDestroy` 清理定时器
3. 建议写测试驱动（可选）：snapshot 生成内容
