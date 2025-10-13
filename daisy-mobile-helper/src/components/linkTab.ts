import { EmptyFun, ValueOrGet, valueOrGetToGet } from 'wy-helper';
import { fLink, routerConsume } from 'mve-dom-helper/history';
import { cns } from 'wy-dom-helper';

export function linkTab({
  href,
  className,
  disabled,
  children,
  toClassName = function (className, active, disabled) {
    return cns(
      'daisy-tab',
      className,
      active ? 'daisy-tab-active' : disabled && 'daisy-tab-disabled'
    );
  },
  isActive = (href, pathname) => {
    return pathname.startsWith(href);
  },
}: {
  href: ValueOrGet<string>;
  disabled?: ValueOrGet<any>;
  className?: string;
  children: EmptyFun;
  isActive?(href: string, pathname: string): boolean;
  toClassName?(
    className: string | undefined,
    active: boolean,
    disabled: boolean
  ): string;
}) {
  const getHref = valueOrGetToGet(href);
  const getDisabled = valueOrGetToGet(disabled);
  const { getHistoryState } = routerConsume();
  fLink({
    href() {
      if (!getDisabled()) {
        return getHref();
      }
    },
    replace: true,
    className() {
      const active = isActive(getHref(), getHistoryState().pathname);
      return toClassName(className, active, getDisabled());
    },
    children,
  });
}
