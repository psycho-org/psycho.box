'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { InputHTMLAttributes } from 'react';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  placeholder?: string;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchInput({
  value: controlledValue,
  onChange,
  onClear,
  debounceMs = 300,
  placeholder = '검색...',
  ...inputProps
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? '');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (!isControlled) setInternalValue(next);

      if (debounceMs > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => onChange?.(next), debounceMs);
      } else {
        onChange?.(next);
      }
    },
    [onChange, debounceMs, isControlled],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue('');
    onChange?.('');
    onClear?.();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [onChange, onClear, isControlled]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative inline-flex items-center">
      <input
        type="search"
        role="searchbox"
        aria-label="검색"
        className="w-full min-w-[200px] border border-line rounded-input bg-surface-2 text-text py-2.5 pl-10 pr-10 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        {...inputProps}
      />
      <span className="absolute left-3 text-text-dim pointer-events-none" aria-hidden>
        🔍
      </span>
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 size-6 rounded grid place-items-center text-text-dim hover:text-text hover:bg-surface-3"
          aria-label="검색어 지우기"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
