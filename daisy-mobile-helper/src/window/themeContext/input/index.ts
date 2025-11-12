import { fdom } from 'mve-dom';
import { input } from 'wy-dom-helper/window-theme';
import { createSignal } from 'wy-helper';
import type { StoreRef } from 'wy-helper';
import { hookTheme } from '../util';

export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: StoreRef<string> | string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onInput?: (value: string, event: Event) => void;
  onChange?: (value: string, event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

export function Input(props: InputProps = {}) {
  const {
    type = 'text',
    value,
    placeholder,
    disabled = false,
    error = false,
    size = 'md',
    className = '',
    onInput,
    onChange,
    onFocus,
    onBlur,
  } = props;

  // 处理 value 的双向绑定
  const valueSignal =
    typeof value === 'string' ? createSignal(value) : value || createSignal('');

  const getCls = hookTheme(input);
  fdom.input({
    type,
    placeholder,
    disabled,

    className() {
      return getCls('input', {
        error,
        size,
        className,
      });
    },

    value() {
      return valueSignal.get();
    },

    onInput(event) {
      const target = event.target as HTMLInputElement;
      const newValue = target.value;
      valueSignal.set(newValue);
      onInput?.(newValue, event);
    },

    onFocus,
    onBlur,
  });

  return valueSignal;
}

export interface TextareaProps {
  value?: StoreRef<string> | string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  rows?: number;
  cols?: number;
  className?: string;
  onInput?: (value: string, event: Event) => void;
  onChange?: (value: string, event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

export function Textarea(props: TextareaProps = {}) {
  const {
    value,
    placeholder,
    disabled = false,
    error = false,
    rows = 4,
    cols,
    className = '',
    onInput,
    onChange,
    onFocus,
    onBlur,
  } = props;

  const valueSignal =
    typeof value === 'string' ? createSignal(value) : value || createSignal('');

  const getCls = hookTheme(input);
  fdom.textarea({
    placeholder,
    disabled,
    rows,
    cols,

    className() {
      return getCls('textarea', {
        error,
        className,
      });
    },

    value() {
      return valueSignal.get();
    },

    onInput(event) {
      const target = event.target as HTMLTextAreaElement;
      const newValue = target.value;
      valueSignal.set(newValue);
      onInput?.(newValue, event);
    },
    onFocus,
    onBlur,
  });

  return valueSignal;
}

export interface SelectProps {
  value?: StoreRef<string> | string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  onChange?: (value: string, event: Event) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

export function Select(props: SelectProps) {
  const {
    value,
    disabled = false,
    error = false,
    className = '',
    options,
    onChange,
    onFocus,
    onBlur,
  } = props;

  const valueSignal =
    typeof value === 'string' ? createSignal(value) : value || createSignal('');

  const getCls = hookTheme(input);
  fdom.select({
    disabled,

    className() {
      return getCls('select', {
        error,
        className,
      });
    },

    value() {
      return valueSignal.get();
    },

    onFocus,
    onBlur,

    children() {
      options.forEach(option => {
        fdom.option({
          value: option.value,
          disabled: option.disabled,
          children: option.label,
        });
      });
    },
  });

  return valueSignal;
}

export interface CheckboxProps {
  checked?: StoreRef<boolean> | boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  onChange?: (checked: boolean, event: Event) => void;
}

export function Checkbox(props: CheckboxProps = {}) {
  const { checked, disabled = false, label, className = '', onChange } = props;

  const checkedSignal =
    typeof checked === 'boolean'
      ? createSignal(checked)
      : checked || createSignal(false);

  const getCls = hookTheme(input);
  fdom.label({
    className() {
      return getCls('checkboxLabel', {
        className,
      });
    },

    children() {
      fdom.input({
        type: 'checkbox',
        disabled,

        checked() {
          return checkedSignal.get();
        },

        onInput(event) {
          const target = event.target as HTMLInputElement;
          const newChecked = target.checked;
          checkedSignal.set(newChecked);
          onChange?.(newChecked, event);
        },
      });

      if (label) {
        fdom.span({
          children: label,
        });
      }
    },
  });

  return checkedSignal;
}

export interface RadioProps {
  name: string;
  value: string;
  checked?: StoreRef<boolean> | boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  onChange?: (value: string, event: Event) => void;
}

export function Radio(props: RadioProps) {
  const {
    name,
    value,
    checked,
    disabled = false,
    label,
    className = '',
    onChange,
  } = props;

  const checkedSignal =
    typeof checked === 'boolean'
      ? createSignal(checked)
      : checked || createSignal(false);

  const getCls = hookTheme(input);
  fdom.label({
    className() {
      return getCls('radioLabel', {
        className,
      });
    },

    children() {
      fdom.input({
        type: 'radio',
        name,
        value,
        disabled,

        checked() {
          return checkedSignal.get();
        },

        onInput(event) {
          const target = event.target as HTMLInputElement;
          if (target.checked) {
            checkedSignal.set(true);
            onChange?.(value, event);
          }
        },
      });

      if (label) {
        fdom.span({
          children: label,
        });
      }
    },
  });

  return checkedSignal;
}
