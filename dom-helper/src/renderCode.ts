import {
  addEffect,
  createSignal,
  GetValue,
  SetValue,
  StoreRef,
  ValueOrGet,
} from 'wy-helper';
import { useContentEditable } from './useContentEditable';
import {
  redo,
  undo,
  appendRecord,
  contentDelete,
  ContentEditableModel,
  contentEnter,
  contentTab,
  getCurrentRecord,
  initContentEditableModel,
  mb,
  getCurrentEditRecord,
  MbRange,
} from 'wy-dom-helper/contentEditable';
import { React } from 'wy-dom-helper';
import { hookTrackSignal } from 'mve-helper';

/**
 * 受控组件模式
 * @param get
 * @param set
 * @returns
 */
export function renderCodeChange(
  get: GetValue<string>,
  onChange: (v: string, range: MbRange) => void
) {
  const model = createSignal(initContentEditableModel(get()));
  hookTrackSignal(get, function (value) {
    addEffect(() => {
      const v = model.get();
      const nv = getCurrentEditRecord(v).value;
      if (nv != value) {
        //改变
        model.set(initContentEditableModel(value));
      }
    });
  });
  return {
    get: model.get,
    set(v: ContentEditableModel) {
      model.set(v);
      const c = getCurrentEditRecord(v);
      onChange(c.value, c.range);
      return v;
    },
  };
}
