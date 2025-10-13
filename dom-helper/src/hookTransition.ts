import { hookTrackSignal } from 'mve-helper';
import { signalEffectForceFlow } from 'wy-dom-helper';
import { createSignal, EmptyFun, GetValue } from 'wy-helper';

export function hookTransition(
  show: GetValue<boolean>,
  //可能需要强制回流
  beginChange: (afterCall: EmptyFun, show: boolean) => void,
  set: Set<Element> = new Set()
) {
  const didShow = createSignal<boolean | 'active'>(show());
  const setActive = () => didShow.set('active');
  let first = true;
  hookTrackSignal(show, function (v) {
    if (first) {
      first = false;
      return;
    }
    if (v) {
      //假变成真
      signalEffectForceFlow(set, () => {
        didShow.set(v);
        beginChange(setActive, v);
      });
    } else {
      //真变成假
      signalEffectForceFlow(set, () => {
        didShow.set(true);
        beginChange(() => didShow.set(v), v);
      });
    }
  });
  return {
    set,
    className(classPrefix: string) {
      const d = didShow.get();
      const s = show();
      if (s) {
        if (d == 'active') {
          //完全进入
          return '';
        }
        if (d) {
          //进入中
          return `${classPrefix}-enter-active ${classPrefix}-enter-to`;
        } else {
          //进入前
          return `${classPrefix}-enter-active ${classPrefix}-enter-from`;
        }
      } else {
        if (d == 'active') {
          //离开前
          return `${classPrefix}-leave-active ${classPrefix}-leave-from`;
        }
        if (d) {
          //离开中
          return `${classPrefix}-leave-active ${classPrefix}-leave-to`;
        } else {
          //完全离开
          return '';
        }
      }
    },
    didShow() {
      //是否还在挂载
      return show() || didShow.get();
    },
  };
}
