# MVE 路由系统

MVE 提供基于目录结构的文件路由系统，通过 `createTreeRoute` 实现自动路由映射。

## 基础配置

### 项目设置

```typescript
// main.ts
import { createTreeRoute, renderOneKey, getBranchKey } from 'mve-helper';
import { createBrowserHistory } from 'history';
import { routerProvide } from 'mve-dom-helper/history';

// 使用 Vite 的 glob 导入
const pages = import.meta.glob('./pages/**');

const { renderBranch, getBranch, preLoad } = createTreeRoute({
  treeArg: {
    number: argForceNumber // 路径参数类型转换
  },
  pages,
  prefix: './pages/',
  aliasMap: {
    //路由映射功能，有以下两种格式
    '/nest-route-demo/[x]/bb'(args) {
      return `/nest-route-demo/bb-${args.x}`;
    },
    'bbb-[x]':'xxx-[x]-bbb'
  },
  renderError(err) {
    console.error('路由错误:', err);
  }
});

createRoot(app, () => {
  const { getHistoryState } = routerProvide(createBrowserHistory());
  
  renderOneKey(
    getBranch(() => getHistoryState().pathname),
    getBranchKey,
    (key, branch) => {
      renderBranch(branch);
    }
  );
});
```

## 目录结构

### 路由结构

```
src/pages/
├── 1.bb-[a-number]
│   └── index.ts  
├── 2.bb-[a]
│   └── index.ts  
├── user/
│   ├── index.ts                    # /user
│   └── [id]/
│       └── index.ts                # /user/:id
├── group/
│   └── [id]/
│       ├── index.ts                # /group/:id
│       └── edit
|           └── index.ts            # /group/:id/edit
└── blog/
    └── [year-number]/
        ├── default.ts              # /blog/下没有找到的路由节点，都转到这里，也享有layout.ts
        ├── layout.ts               # /blog/:year及后缀路由节点共享的布局
        ├── index.ts                # /blog/:year
        └── [month-number]/
            └── index.ts            # /blog/:year/:month 其中year与month的参数需要经过注入的number函数校验，成功才能进入
```

上述中，`1.bb-[a-number]`对应bb-98这种路由，当路由节点使用`1.`,`2.`这样开头时，表示使用前面的数字从小到大排序。

## 页面组件

### 叶子页面 (Leaf)

```typescript
// pages/about.ts
import { fdom } from 'mve-dom';
import { LeafLoaderParam } from 'mve-helper';

export default function(param: LeafLoaderParam) {
  fdom.div({
    children() {
      fdom.h1({ children: '关于我们' });
      fdom.p({ children: '这是关于页面' });
    }
  });
}
```

### 分支页面 (Branch)

```typescript
// pages/home/layout.ts
import { fdom } from 'mve-dom';
import { BranchLoaderParam } from 'mve-helper';

export default function(param: BranchLoaderParam) {
  fdom.div({
    className: 'home-layout',
    children() {
      // 导航栏
      fdom.nav({
        children() {
          fdom.a({ href: param.getAbsolutePath('./dashboard'), children: '仪表板' });
          fdom.a({ href: param.getAbsolutePath('./settings'), children: '设置' });
        }
      });
      
      // 子路由内容
      param.renderBranch(() => param.getChildren());
    }
  });
}
```

### 默认页面(Default)
未找到的路由跳转处
```ts
import { dom } from 'mve-dom';
import { NotfoundLoaderParam } from 'mve-helper';

export default function (a: NotfoundLoaderParam) {
  dom.div({})
    .renderText`${() => JSON.stringify(a.getQuery())} -- ${() => a.get().nodes.slice(a.get().index).join('/')}`;
}
```

### 动态路由参数

```typescript
// pages/user/[id]/index.ts
import { GetValue } from 'wy-helper';
import { LeafLoaderParam } from 'mve-helper';

export default function(param: LeafLoaderParam<{ id: string }>) {
  fdom.div({
    children() {
      fdom.h1({ 
        childrenType:'text',
        children(){
          return `用户 ID: ${param.getQuery().id}` 
        }
      });
    }
  });
}

```

## 路由导航

### 声明式导航

```typescript
import { fLink } from 'mve-dom-helper/history';

fLink({
  href: '/user/123',
  className: 'nav-link',
  children: '用户详情'
});
```

### 编程式导航

```typescript
import { routerConsume } from 'mve-dom-helper/history';

export default function() {
  const { router } = routerConsume();
  
  fdom.button({
    onClick() {
      router.push('/dashboard');
    },
    children: '跳转到仪表板'
  });
  
  fdom.button({
    onClick() {
      router.replace('/login');
    },
    children: '替换到登录页'
  });
  
  fdom.button({
    onClick() {
      router.back();
    },
    children: '返回'
  });
}
```

这里，router通常是调用history这个npm包生成的history


### 相对路径导航

```typescript
// 在 /home/settings 页面中
export default function(param: LeafLoaderParam) {
  fdom.div({
    children() {
      fLink({
        href: param.getAbsolutePath('./profile'), // /home/settings/profile
        children: '个人资料'
      });
      
      fLink({
        href: param.getAbsolutePath('../dashboard'), // /home/dashboard
        children: '仪表板'
      });
    }
  });
}
```

## 路由参数

### 参数类型转换

```typescript
// 数字参数转换
export const argForceNumber = (n: string) => {
  if (!n) throw new Error('参数不能为空');
  const x = Number(n);
  if (isNaN(x)) throw new Error('不是有效数字: ' + n);
  return x;
};

const { renderBranch, getBranch } = createTreeRoute({
  treeArg: {
    id: argForceNumber,    // [id] 参数转为数字
    page: argForceNumber   // [page] 参数转为数字
  },
  pages,
  prefix: './pages/'
});
```

### 查询参数

```typescript
export default function(param: LeafLoaderParam) {
  // URL: /search?q=keyword&page=1
  const query = param.getQuery();
  
  fdom.div({
    children() {
      fdom.p({
        childrenType:'text',
        children:()=> `搜索关键词: ${param.getQuery().q}`
      });
      fdom.p({ 
        childrenType:'text',
        children:()=> `页码: ${param.getQuery().page}` 
      });
    }
  });
}
```

## 路由守卫

### 预加载

```typescript
export default function(param: BranchLoaderParam) {
  // 预加载子路由
  param.preLoad('/user/profile');
  param.preLoad('/user/settings');
  
  fdom.div({
    children() {
      // 导航链接
      fLink({ href: '/user/profile', children: '个人资料' });
      fLink({ href: '/user/settings', children: '设置' });
    }
  });
}
```

### 路由拦截

```typescript
// pages/admin/layout.ts
export default function(param: BranchLoaderParam) {
  const { router } = routerConsume();
  
  // 检查权限
  if (!isAuthenticated()) {
    router.replace('/login');
    return;
  }
  
  // 渲染管理页面
  param.renderBranch(() => param.getChildren());
}
```

## 错误处理

### 404 页面

```typescript
// pages/default.ts - 默认 404 页面
export default function() {
  fdom.div({
    className: 'error-page',
    children() {
      fdom.h1({ children: '404 - 页面未找到' });
      fLink({ href: '/', children: '返回首页' });
    }
  });
}
```

### 错误边界

```typescript
const { renderBranch, getBranch } = createTreeRoute({
  pages,
  prefix: './pages/',
  renderError(error) {
    fdom.div({
      className: 'error-boundary',
      children() {
        fdom.h2({ children: '页面加载失败' });
        fdom.p({ children: error.message });
        fdom.button({
          onClick: () => location.reload(),
          children: '重新加载'
        });
      }
    });
  }
});
```

## 高级特性

### 路由动画

```typescript
import { renderLayoutPage } from 'daisy-mobile-helper';
import { TasksContext } from './components/renderTabPage';

// 提供动画方向
TasksContext.provide({
  getDirection() {
    const action = getHistoryState().action;
    return action === Action.Pop ? 'toLeft' : 'toRight';
  }
});

// 使用页面动画
renderLayoutPage(
  getBranch(() => getHistoryState().pathname),
  renderBranch,
  getDirection,
  {
    init: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '-100%' }
  }
);
```

**动画配置**
- 滑动: `{ init: { x: '100%' }, animate: { x: 0 }, exit: { x: '-100%' } }`
- 淡入: `{ init: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }`
- 缩放: `{ init: { scale: 0.8 }, animate: { scale: 1 }, exit: { scale: 1.2 } }`

**标签页动画**
```typescript
import { renderTabLink, getTabsDirection } from 'daisy-mobile-helper';

renderTabLink(param, tabs, findTabIndex, {
  className: 'flex-1 overflow-hidden'
});
```

**手势滑动**
```typescript
import { moveProvide, moveConsume } from 'daisy-mobile-helper';

moveProvide({
  left: (e) => console.log('向左滑动'),
  right: (e) => console.log('向右滑动')
});
```

### 标签页路由

```typescript
// home/layout.ts
export default function(param: BranchLoaderParam) {
  const tabs = [
    { href: './dashboard', label: '仪表板' },
    { href: './settings', label: '设置' },
    { href: './profile', label: '个人资料' }
  ];
  
  // 预加载所有标签页
  tabs.forEach(tab => {
    param.preLoad(param.getAbsolutePath(tab.href));
  });
  
  fdom.div({
    children() {
      // 标签导航
      fdom.nav({
        children() {
          tabs.forEach(tab => {
            fLink({
              href: param.getAbsolutePath(tab.href),
              className: () => {
                const pathname = getHistoryState().pathname;
                return pathname.startsWith(param.getAbsolutePath(tab.href)) 
                  ? 'tab-active' : 'tab';
              },
              children: tab.label
            });
          });
        }
      });
      
      // 标签内容
      param.renderBranch(() => param.getChildren());
    }
  });
}
```

## 最佳实践

### 1. 目录组织

- 使用 `index.ts` 作为默认页面
- 使用 `layout.ts` 作为布局组件
- 动态路由使用 `[param]` 格式
- 相关页面放在同一目录下

### 2. 性能优化

- 使用 `preLoad` 预加载关键路由
- 合理使用路由懒加载
- 避免在路由组件中进行重计算

### 3. 用户体验

- 提供加载状态和错误处理
- 使用路由动画提升体验
- 保持 URL 和页面状态同步

### 4. 类型安全

```typescript
// 定义路由参数类型
interface UserParams {
  id: string;
}

interface BlogParams {
  year: number;
  month: number;
}

export default function(param: LeafLoaderParam<UserParams>) {
  const { id } = param.getQuery(); // TypeScript 类型推断
}
```

通过 MVE 的文件路由系统，你可以构建结构清晰、易于维护的单页应用，享受类型安全和优秀的开发体验。