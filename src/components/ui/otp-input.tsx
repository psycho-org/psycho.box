'use client';

import {
  useRef,
  useCallback,
  useEffect,
  KeyboardEvent,
  ClipboardEvent,
  ChangeEvent,
} from 'react';

const LENGTH = 6;
const SPLIT_AT = 3;

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}

const inputBase =
  'w-10 h-12 text-center text-lg font-mono border border-line rounded-lg bg-surface-2 text-text focus:outline-2 focus:outline-accent focus:outline-offset-1 transition-colors';

export function OtpInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  className = '',
  inputClassName = '',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      refs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const digits = value.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);

  const focusAt = useCallback((index: number) => {
    const i = Math.max(0, Math.min(index, LENGTH - 1));
    refs.current[i]?.focus();
  }, []);

  const setDigit = useCallback(
    (index: number, digit: string) => {
      const next = digits.slice();
      next[index] = digit;
      onChange(next.join('').trimEnd().slice(0, LENGTH));
    },
    [digits, onChange],
  );

  const handleKeyDown = (index: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      setDigit(index - 1, '');
      focusAt(index - 1);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight' && index < LENGTH - 1) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handleChange = (index: number) => (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length === 0) {
      setDigit(index, '');
      return;
    }
    const digit = v.replace(/\D/g, '').slice(-1);
    if (digit) {
      setDigit(index, digit);
      if (index < LENGTH - 1) focusAt(index + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData('text');
    const nums = raw.replace(/\D/g, '').slice(0, LENGTH);
    if (nums.length > 0) {
      const next = nums.padEnd(LENGTH, ' ').split('').slice(0, LENGTH);
      onChange(next.join('').trimEnd());
      focusAt(Math.min(nums.length, LENGTH) - 1);
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {Array.from({ length: LENGTH }).map((_, i) => (
        <span key={i} className="flex items-center gap-2">
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digits[i] === ' ' ? '' : digits[i]}
            onChange={handleChange(i)}
            onKeyDown={handleKeyDown(i)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`${inputBase} ${inputClassName}`}
            aria-label={`OTP ${i + 1}번째 자리`}
          />
          {i === SPLIT_AT - 1 && (
            <span className="text-text-dim font-mono text-lg">-</span>
          )}
        </span>
      ))}
    </div>
  );
}
