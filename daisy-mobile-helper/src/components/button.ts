import { fdom, FDomAttributes } from 'mve-dom';
import { toButtonClick } from 'mve-dom-helper';
import { cns } from 'wy-dom-helper';
import { GetValue, tw, valueOrGetToGet } from 'wy-helper';

export function button(
  props: FDomAttributes<'button'> & {
    loadingClassName?: string;
    loading?: GetValue<any>;
  }
) {
  const newProps = { ...props };
  const loadingClassName = props.loadingClassName || tw`daisy-loading-spinner`;
  const className = valueOrGetToGet(newProps.className || '');
  if (props.onClick) {
    const n = toButtonClick(props as any);
    newProps.onClick = n.onClick;
    newProps.loading = n.loading;
  }
  newProps.className = function () {
    return cns(
      'daisy-btn',
      className(),
      newProps.loading?.() &&
        tw`daisy-btn-disabled daisy-loading ${loadingClassName}`
    );
  };
  return fdom.button(newProps);
}
