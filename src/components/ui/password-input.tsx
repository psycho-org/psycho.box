'use client';

import { useId, useState } from 'react';

export interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  helperText?: string;
  validateWith?: RegExp;
  id?: string;
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function PasswordInput({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  minLength,
  maxLength,
  placeholder,
  helperText,
  validateWith,
  id,
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const shouldShowValidation = !!validateWith && value.length > 0;
  const isValid = shouldShowValidation ? validateWith.test(value) : false;

  return (
    <label className="grid gap-1.5 text-[13px] text-text-soft">
      {label}
      <span className="relative flex">
        <input
          id={inputId}
          className="w-full border border-line rounded-input bg-surface-2 text-text py-2.5 px-3 pr-20 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
        />
        {shouldShowValidation && (
          <span
            className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center"
            title={isValid ? '규칙에 맞습니다' : helperText}
            aria-hidden
          >
            {isValid ? <CheckIcon /> : <XIcon />}
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text-soft"
          title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
        >
          {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
      </span>
      {helperText ? <span className="text-[11px] text-text-dim mt-0.5">{helperText}</span> : null}
    </label>
  );
}
