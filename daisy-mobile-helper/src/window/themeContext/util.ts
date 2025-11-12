/**
 * 如果token是常量,ok
 * 主要是token是变量,则需要生成getter/setter,但却没有贫血模型的覆盖.
 *
 */
import { createContext } from 'mve-core';
import { hookTrackSignal } from 'mve-helper';
import {
  CreateStyle,
  StyleConfig,
  StyleConfigMap,
  StyleVariants,
  StyleVariantsMap,
} from 'wy-dom-helper';
import { memo } from 'wy-helper';

import {
  DesignTokens,
  ThemeData,
  defaultTokens,
} from 'wy-dom-helper/window-theme';
const themeContext = createContext<() => ThemeData>(
  memo(() => {
    return {
      prefix: 'ds-',
      tokens: defaultTokens,
    };
  })
);

export function hookRewriteTheme(callback: (old: ThemeData) => ThemeData) {
  const get = themeContext.consume();
  themeContext.provide(
    memo(() => {
      return callback(get());
    })
  );
}

export function hookTheme<T extends StyleConfigMap>(
  data: CreateStyle<T, DesignTokens>
) {
  const get = themeContext.consume();
  const getId = memo(() => {
    const theme = get();
    return data.getId(theme.prefix, theme.tokens);
  });
  hookTrackSignal(getId, function (old) {
    return old.effect();
  });
  return function <K extends keyof T & string>(
    name: K,
    a?: Partial<StyleVariantsMap<T>[K]>
  ) {
    return data.getClassName(getId(), name, a);
  };
}
