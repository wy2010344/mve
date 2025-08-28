# TDesign Vue Mobile 迁移指南

专门针对 TDesign Vue Mobile 项目迁移到 MVE 的详细指南。

## 🎯 迁移策略

### 渐进式迁移

1. **保持现有 Vue 项目结构**
2. **逐个组件迁移**
3. **共享样式和主题系统**
4. **保持 API 兼容性**

### 项目结构对比

```
// TDesign Vue Mobile 项目结构
src/
├── components/           # 组件库
│   ├── button/
│   │   ├── button.vue
│   │   ├── index.ts
│   │   └── style/
├── composables/         # 组合式函数
├── utils/              # 工具函数
└── styles/             # 样式文件

// MVE 迁移后结构
src/
├── components/           # 组件库
│   ├── button/
│   │   ├── button.ts    # MVE 组件
│   │   ├── index.ts
│   │   └── style/       # 保持不变
├── hooks/              # MVE hooks
├── utils/              # 工具函数（保持不变）
└── styles/             # 样式文件（保持不变）
```

## 🧩 核心组件迁移

### Button 组件

```typescript
// TDesign Vue Mobile - button.vue
<template>
  <button 
    :class="buttonClass"
    :disabled="disabled"
    :style="buttonStyle"
    @click="handleClick"
  >
    <t-loading v-if="loading" :size="loadingSize" />
    <t-icon v-if="icon && !loading" :name="icon" />
    <span v-if="$slots.default" class="t-button__text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ButtonProps } from './types';

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'medium',
  shape: 'rectangle',
  disabled: false,
  loading: false,
  block: false
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClass = computed(() => [
  't-button',
  `t-button--${props.variant}`,
  `t-button--${props.size}`,
  `t-button--${props.shape}`,
  {
    't-button--disabled': props.disabled,
    't-button--loading': props.loading,
    't-button--block': props.block
  }
]);

const buttonStyle = computed(() => ({
  ...(props.customStyle || {})
}));

const loadingSize = computed(() => {
  const sizeMap = { small: '16px', medium: '20px', large: '24px' };
  return sizeMap[props.size] || '20px';
});

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return;
  emit('click', event);
};
</script>

// MVE 迁移版本 - button.ts
import { fdom } from "mve-dom";
import { createSignal, memo } from "wy-helper";
import { Loading } from "../loading";
import { Icon } from "../icon";

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  shape?: 'rectangle' | 'round' | 'circle';
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  icon?: string;
  customStyle?: Record<string, string>;
  onClick?: (event: MouseEvent) => void;
  children?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'medium', 
  shape = 'rectangle',
  disabled = false,
  loading = false,
  block = false,
  icon,
  customStyle,
  onClick,
  children
}: ButtonProps) {
  
  // 计算类名
  const buttonClass = memo(() => [
    't-button',
    `t-button--${variant}`,
    `t-button--${size}`,
    `t-button--${shape}`,
    disabled ? 't-button--disabled' : '',
    loading ? 't-button--loading' : '',
    block ? 't-button--block' : ''
  ].filter(Boolean).join(' '));
  
  // 计算加载图标大小
  const loadingSize = memo(() => {
    const sizeMap = { small: '16px', medium: '20px', large: '24px' };
    return sizeMap[size] || '20px';
  });
  
  // 点击处理
  const handleClick = (event: MouseEvent) => {
    if (disabled || loading) return;
    onClick?.(event);
  };
  
  fdom.button({
    className() {
      return buttonClass();
    },
    disabled: disabled || loading,
    onClick: handleClick,
    // 自定义样式
    ...(customStyle ? Object.keys(customStyle).reduce((acc, key) => {
      acc[`s_${key}`] = customStyle[key];
      return acc;
    }, {} as any) : {}),
    children() {
      // 加载状态
      if (loading) {
        Loading({
          size: loadingSize()
        });
      }
      
      // 图标
      if (icon && !loading) {
        Icon({
          name: icon
        });
      }
      
      // 文本内容
      if (children) {
        fdom.span({
          className: "t-button__text",
          children
        });
      }
    }
  });
}
```

### Cell 组件

```typescript
// TDesign Vue Mobile - cell.vue
<template>
  <div 
    :class="cellClass"
    @click="handleClick"
  >
    <div class="t-cell__left">
      <div v-if="$slots.leftIcon" class="t-cell__left-icon">
        <slot name="leftIcon" />
      </div>
      <div class="t-cell__content">
        <div class="t-cell__title">{{ title }}</div>
        <div v-if="description" class="t-cell__description">{{ description }}</div>
      </div>
    </div>
    <div class="t-cell__right">
      <div v-if="note" class="t-cell__note">{{ note }}</div>
      <div v-if="$slots.rightIcon" class="t-cell__right-icon">
        <slot name="rightIcon" />
      </div>
      <t-icon v-if="arrow" name="chevron-right" class="t-cell__arrow" />
    </div>
  </div>
</template>

// MVE 迁移版本 - cell.ts
export interface CellProps {
  title: string;
  description?: string;
  note?: string;
  arrow?: boolean;
  clickable?: boolean;
  leftIcon?: () => void;
  rightIcon?: () => void;
  onClick?: () => void;
}

export function Cell({
  title,
  description,
  note,
  arrow = false,
  clickable = false,
  leftIcon,
  rightIcon,
  onClick
}: CellProps) {
  
  const cellClass = memo(() => [
    't-cell',
    clickable ? 't-cell--clickable' : '',
    onClick ? 't-cell--clickable' : ''
  ].filter(Boolean).join(' '));
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  fdom.div({
    className() {
      return cellClass();
    },
    onClick: onClick ? handleClick : undefined,
    children() {
      // 左侧内容
      fdom.div({
        className: "t-cell__left",
        children() {
          // 左侧图标
          if (leftIcon) {
            fdom.div({
              className: "t-cell__left-icon",
              children: leftIcon
            });
          }
          
          // 主要内容
          fdom.div({
            className: "t-cell__content",
            children() {
              fdom.div({
                className: "t-cell__title",
                childrenType: "text",
                children: title
              });
              
              if (description) {
                fdom.div({
                  className: "t-cell__description",
                  childrenType: "text",
                  children: description
                });
              }
            }
          });
        }
      });
      
      // 右侧内容
      fdom.div({
        className: "t-cell__right",
        children() {
          // 备注文本
          if (note) {
            fdom.div({
              className: "t-cell__note",
              childrenType: "text",
              children: note
            });
          }
          
          // 右侧图标
          if (rightIcon) {
            fdom.div({
              className: "t-cell__right-icon",
              children: rightIcon
            });
          }
          
          // 箭头
          if (arrow) {
            Icon({
              name: "chevron-right",
              className: "t-cell__arrow"
            });
          }
        }
      });
    }
  });
}
```

### Input 组件

```typescript
// TDesign Vue Mobile - input.vue
<template>
  <div :class="inputClass">
    <div v-if="label" class="t-input__label">{{ label }}</div>
    <div class="t-input__wrap">
      <input
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <div v-if="clearable && modelValue" class="t-input__clear" @click="handleClear">
        <t-icon name="close-circle-filled" />
      </div>
    </div>
    <div v-if="errorMessage" class="t-input__error">{{ errorMessage }}</div>
  </div>
</template>

// MVE 迁移版本 - input.ts
export interface InputProps {
  value?: string;
  type?: 'text' | 'password' | 'number' | 'tel' | 'email';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  clearable?: boolean;
  maxlength?: number;
  errorMessage?: string;
  onInput?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function Input({
  value = '',
  type = 'text',
  label,
  placeholder,
  disabled = false,
  readonly = false,
  clearable = false,
  maxlength,
  errorMessage,
  onInput,
  onFocus,
  onBlur
}: InputProps) {
  
  const inputValue = createSignal(value);
  
  // 同步外部值变化
  hookTrackSignal(() => value, (newValue) => {
    if (newValue !== inputValue.get()) {
      inputValue.set(newValue);
    }
  });
  
  const inputClass = memo(() => [
    't-input',
    disabled ? 't-input--disabled' : '',
    readonly ? 't-input--readonly' : '',
    errorMessage ? 't-input--error' : ''
  ].filter(Boolean).join(' '));
  
  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const newValue = target.value;
    inputValue.set(newValue);
    onInput?.(newValue);
  };
  
  const handleClear = () => {
    inputValue.set('');
    onInput?.('');
  };
  
  const handleFocus = () => {
    onFocus?.();
  };
  
  const handleBlur = () => {
    onBlur?.();
  };
  
  fdom.div({
    className() {
      return inputClass();
    },
    children() {
      // 标签
      if (label) {
        fdom.div({
          className: "t-input__label",
          childrenType: "text",
          children: label
        });
      }
      
      // 输入框容器
      fdom.div({
        className: "t-input__wrap",
        children() {
          // 输入框
          fdom.input({
            type,
            value() {
              return inputValue.get();
            },
            placeholder,
            disabled,
            readonly,
            maxlength,
            onInput: handleInput,
            onFocus: handleFocus,
            onBlur: handleBlur
          });
          
          // 清除按钮
          if (clearable && inputValue.get()) {
            fdom.div({
              className: "t-input__clear",
              onClick: handleClear,
              children() {
                Icon({
                  name: "close-circle-filled"
                });
              }
            });
          }
        }
      });
      
      // 错误信息
      if (errorMessage) {
        fdom.div({
          className: "t-input__error",
          childrenType: "text",
          children: errorMessage
        });
      }
    }
  });
}
```

## 🎨 样式系统迁移

### CSS 变量和主题

```scss
// 保持现有的 CSS 变量系统
:root {
  --td-brand-color: #0052d9;
  --td-warning-color: #ed7b2f;
  --td-error-color: #d54941;
  --td-success-color: #00a870;
}

// TDesign 的样式类保持不变
.t-button {
  // 现有样式保持不变
}
```

### 响应式样式

```typescript
// Vue 中的动态样式
<div :style="{ 
  color: theme === 'dark' ? '#fff' : '#000',
  backgroundColor: isActive ? 'var(--td-brand-color)' : 'transparent'
}">

// MVE 中的响应式样式
fdom.div({
  s_color() {
    return theme.get() === 'dark' ? '#fff' : '#000';
  },
  s_backgroundColor() {
    return isActive.get() ? 'var(--td-brand-color)' : 'transparent';
  }
});
```

## 🔧 Composables 迁移

### useToggle

```typescript
// Vue Composable
export function useToggle(initialValue = false) {
  const state = ref(initialValue);
  
  const toggle = () => {
    state.value = !state.value;
  };
  
  const setTrue = () => {
    state.value = true;
  };
  
  const setFalse = () => {
    state.value = false;
  };
  
  return {
    state: readonly(state),
    toggle,
    setTrue,
    setFalse
  };
}

// MVE Hook
export function useToggle(initialValue = false) {
  const state = createSignal(initialValue);
  
  const toggle = () => {
    state.set(!state.get());
  };
  
  const setTrue = () => {
    state.set(true);
  };
  
  const setFalse = () => {
    state.set(false);
  };
  
  return {
    state,
    toggle,
    setTrue,
    setFalse
  };
}
```

### useRequest

```typescript
// Vue Composable
export function useRequest<T>(requestFn: () => Promise<T>) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  
  const execute = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      data.value = await requestFn();
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };
  
  return {
    data: readonly(data),
    loading: readonly(loading),
    error: readonly(error),
    execute
  };
}

// MVE Hook
export function useRequest<T>(requestFn: () => Promise<T>) {
  const data = createSignal<T | null>(null);
  const loading = createSignal(false);
  const error = createSignal<Error | null>(null);
  
  const execute = async () => {
    loading.set(true);
    error.set(null);
    
    try {
      const result = await requestFn();
      
      // 检查组件是否已销毁
      if (!hookIsDestroyed()) {
        data.set(result);
      }
    } catch (err) {
      if (!hookIsDestroyed()) {
        error.set(err as Error);
      }
    } finally {
      if (!hookIsDestroyed()) {
        loading.set(false);
      }
    }
  };
  
  return {
    data,
    loading,
    error,
    execute
  };
}
```

## 📱 移动端特性

### 触摸事件处理

```typescript
// Vue 中的触摸事件
<div 
  @touchstart="handleTouchStart"
  @touchmove="handleTouchMove"
  @touchend="handleTouchEnd"
>

// MVE 中的触摸事件
fdom.div({
  onTouchStart: handleTouchStart,
  onTouchMove: handleTouchMove,
  onTouchEnd: handleTouchEnd
});
```

### 滚动处理

```typescript
// Vue Composable
export function useScroll() {
  const scrollTop = ref(0);
  const isScrolling = ref(false);
  
  const handleScroll = throttle(() => {
    scrollTop.value = window.scrollY;
  }, 16);
  
  onMounted(() => {
    window.addEventListener('scroll', handleScroll);
  });
  
  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
  });
  
  return { scrollTop, isScrolling };
}

// MVE Hook
export function useScroll() {
  const scrollTop = createSignal(0);
  const isScrolling = createSignal(false);
  
  const handleScroll = throttle(() => {
    scrollTop.set(window.scrollY);
  }, 16);
  
  // 组件挂载时添加监听器
  window.addEventListener('scroll', handleScroll);
  
  // 组件销毁时清理
  hookDestroy(() => {
    window.removeEventListener('scroll', handleScroll);
  });
  
  return { scrollTop, isScrolling };
}
```

## 🚀 性能优化

### 虚拟滚动

```typescript
// TDesign Vue Mobile 虚拟滚动
<t-virtual-list
  :data="items"
  :item-height="50"
  :container-height="300"
>
  <template #default="{ item, index }">
    <div>{{ item.name }}</div>
  </template>
</t-virtual-list>

// MVE 虚拟滚动
function VirtualList<T>({
  data,
  itemHeight,
  containerHeight,
  renderItem
}: {
  data: () => T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => void;
}) {
  const scrollTop = createSignal(0);
  
  const visibleRange = memo(() => {
    const scroll = scrollTop.get();
    const start = Math.floor(scroll / itemHeight);
    const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + 1, data().length);
    return { start, end };
  });
  
  const visibleItems = memo(() => {
    const range = visibleRange();
    return data().slice(range.start, range.end);
  });
  
  fdom.div({
    s_height: `${containerHeight}px`,
    s_overflow: "auto",
    onScroll(e) {
      const target = e.target as HTMLElement;
      scrollTop.set(target.scrollTop);
    },
    children() {
      // 占位容器
      fdom.div({
        s_height: `${data().length * itemHeight}px`,
        s_position: "relative",
        children() {
          // 可见项目
          renderArray(() => visibleItems(), (item, getIndex) => {
            const actualIndex = visibleRange().start + getIndex();
            
            fdom.div({
              s_position: "absolute",
              s_top: `${actualIndex * itemHeight}px`,
              s_height: `${itemHeight}px`,
              children() {
                renderItem(item, actualIndex);
              }
            });
          });
        }
      });
    }
  });
}
```

## 📦 打包和构建

### Vite 配置调整

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // 保持现有配置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // 添加 MVE 相关别名
      'mve-dom': path.resolve(__dirname, 'node_modules/mve-dom'),
      'mve-core': path.resolve(__dirname, 'node_modules/mve-core'),
      'wy-helper': path.resolve(__dirname, 'node_modules/wy-helper')
    }
  },
  // 其他配置保持不变
});
```

## 🧪 测试迁移

### 组件测试

```typescript
// Vue Test Utils
import { mount } from '@vue/test-utils';
import Button from './Button.vue';

test('button click', async () => {
  const wrapper = mount(Button, {
    props: { onClick: vi.fn() }
  });
  
  await wrapper.find('button').trigger('click');
  expect(wrapper.emitted('click')).toBeTruthy();
});

// MVE 测试
import { Button } from './Button';

test('button click', () => {
  const onClick = vi.fn();
  const container = document.createElement('div');
  
  // 渲染组件
  render(() => {
    Button({
      onClick,
      children() {
        fdom.span({
          childrenType: "text",
          children: "Click me"
        });
      }
    });
  }, container);
  
  // 触发点击
  const button = container.querySelector('button');
  button?.click();
  
  expect(onClick).toHaveBeenCalled();
});
```

这个迁移指南应该能帮助你顺利将 TDesign Vue Mobile 项目迁移到 MVE 框架。关键是保持渐进式迁移，逐个组件进行转换，同时保持样式系统和 API 的兼容性。