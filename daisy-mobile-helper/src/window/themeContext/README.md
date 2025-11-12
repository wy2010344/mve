# 主题上下文系统

基于 MVE 框架的主题系统，支持运行时动态前缀和主题切换。

## 🎯 核心特性

- **动态前缀**: 运行时切换 CSS 类名前缀，避免冲突
- **主题切换**: 支持动态颜色和设计令牌切换
- **性能优化**: 基于缓存的样式注入，相同主题复用样式
- **类型安全**: 完整的 TypeScript 支持

## 🚀 快速开始

### 1. 基础使用

```typescript
import { Button } from './button';

// 使用默认主题
Button({ variant: 'primary', children: 'Click me' });
```

### 2. 自定义前缀

```typescript
import { hookRewriteTheme } from './util';

// 修改前缀避免冲突
hookRewriteTheme(oldTheme => ({
  ...oldTheme,
  prefix: 'my-app-', // 所有类名变为 my-app-button 等
}));
```

### 3. 自定义主题颜色

```typescript
hookRewriteTheme(oldTheme => ({
  ...oldTheme,
  tokens: {
    ...oldTheme.tokens,
    primary: '#ef4444', // 红色主题
    secondary: '#3b82f6', // 蓝色次要色
  },
}));
```

## 📦 组件使用

### Button 组件

```typescript
// 基础按钮
Button({ variant: 'primary', children: 'Primary Button' });
Button({ variant: 'secondary', children: 'Secondary Button' });
Button({ variant: 'ghost', children: 'Ghost Button' });

// 不同尺寸
Button({ size: 'sm', children: 'Small' });
Button({ size: 'lg', children: 'Large' });

// 禁用状态
Button({ disabled: true, children: 'Disabled' });

// 点击事件
Button({
  onClick: e => console.log('clicked'),
  children: 'Click me',
});
```

### IconButton 组件

```typescript
IconButton({ variant: 'primary', icon: '⚙️', title: '设置' });
IconButton({ variant: 'secondary', icon: '🔍', title: '搜索' });
```

## 🎨 主题系统

### 设计令牌

系统基于 Material Design 3.0 设计令牌：

```typescript
interface DesignTokens {
  // 颜色系统
  colorPrimary: string;
  colorSecondary: string;
  colorTertiary: string;
  colorError: string;

  // 间距系统
  spaceXs: string; // 4px
  spaceSm: string; // 8px
  spaceMd: string; // 16px
  spaceLg: string; // 24px

  // 圆角系统
  radiusSm: string; // 4px
  radiusMd: string; // 8px
  radiusLg: string; // 12px

  // 阴影系统
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;

  // 动画系统
  transitionFast: string;
  transitionNormal: string;
}
```

### 主题切换

```typescript
// 完整主题切换
hookRewriteTheme(oldTheme => ({
  prefix: 'new-theme-',
  tokens: {
    ...oldTheme.tokens,
    primary: '#10b981',
    secondary: '#059669',
    // 更多自定义...
  },
}));
```

## 🔧 工作原理

### 1. 样式缓存机制

```typescript
// 相同主题的组件会复用样式，不会重复生成 <style> 标签
Button(); // 生成样式
Button(); // 复用样式
Button(); // 复用样式
```

### 2. 动态类名生成

```typescript
// 基于主题前缀动态生成类名
const theme = { prefix: 'my-app-' };
// 生成: my-app-button my-app-button--primary
```

### 3. CSS-in-JS 编译

```typescript
// CSS 对象自动编译为字符串并注入 DOM
{
  display: 'inline-flex',
  '&:hover': { transform: 'translateY(-1px)' }
}
// 编译为:
// .cls-123 { display: inline-flex; }
// .cls-123:hover { transform: translateY(-1px); }
```

## 📊 性能特点

- **样式复用**: 相同主题的组件共享样式
- **按需注入**: 只有使用的组件才会注入样式
- **缓存机制**: 基于主题内容的智能缓存
- **自动清理**: 主题切换时自动清理旧样式

## 🎯 使用场景

1. **多租户系统**: 不同租户使用不同前缀和主题
2. **微前端**: 避免不同应用间的样式冲突
3. **白标产品**: 为不同客户提供定制主题
4. **组件库**: 提供可定制的组件系统

这个主题系统完美解决了 CSS 类名冲突问题，同时提供了强大的主题定制能力。
