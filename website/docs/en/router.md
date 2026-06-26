# Routing

MVE provides file-system-based routing via `createTreeRoute`.

## Setup

```typescript
import { createTreeRoute, renderOneKey, getBranchKey } from 'mve-helper'
import { createBrowserHistory } from 'history'
import { routerProvide } from 'mve-dom-helper/history'

const pages = import.meta.glob('./pages/**')

const { renderBranch, getBranch, preLoad } = createTreeRoute({
  pages,
  prefix: './pages/',
  aliasMap: {
    '/nest-route-demo/[x]/bb'(args) {
      return `/nest-route-demo/bb-${args.x}`
    },
  },
  renderError(err) {
    console.error('Route error:', err)
  },
})

createRoot(app, () => {
  const { getHistoryState } = routerProvide(createBrowserHistory())
  renderOneKey(
    getBranch(() => getHistoryState().pathname),
    getBranchKey,
    (key, branch) => renderBranch(branch)
  )
})
```

## Directory Structure

```
src/pages/
├── index.ts                    # /
├── user/
│   ├── index.ts                # /user
│   └── [id]/index.ts           # /user/:id
├── group/[id]/
│   ├── index.ts                # /group/:id
│   └── edit/index.ts           # /group/:id/edit
└── blog/[year-number]/
    ├── default.ts              # 404 fallback within /blog
    ├── layout.ts               # shared layout for /blog/:year
    ├── index.ts                # /blog/:year
    └── [month-number]/index.ts # /blog/:year/:month
```

## Navigation

```typescript
// Declarative
fLink({ href: '/user/123', children: 'User Detail' })

// Programmatic
const { router } = routerConsume()
router.push('/dashboard')
router.replace('/login')
router.back()

// Relative
param.getAbsolutePath('./profile')  // /current/profile
param.getAbsolutePath('../settings') // /settings
```

## Route Guards

```typescript
// Preload
param.preLoad('/user/profile')

// Auth guard
if (!isAuthenticated()) {
  router.replace('/login')
  return
}
param.renderBranch(() => param.getChildren())
```
