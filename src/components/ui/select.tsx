'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'inline';
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const SIZE_TRIGGER: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'px-2 py-1.5 text-[12px] gap-1.5',
  md: 'px-3 py-2.5 text-[14px] gap-2',
  lg: 'px-4 py-3 text-[20px] font-semibold gap-3',
};

const SIZE_CHEVRON: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-5',
};

const SIZE_OPTION: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'px-2.5 py-1.5 text-[12px]',
  md: 'px-3 py-2 text-[13px]',
  lg: 'px-4 py-2.5 text-[15px]',
};

const RADIUS_TRIGGER: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'rounded-lg',
  md: 'rounded-input',
  lg: 'rounded-card',
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  id,
  className = '',
  size = 'md',
  variant = 'default',
  onClick,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, close]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(options.findIndex((o) => o.value === value));
        } else if (highlightedIndex >= 0) {
          onChange(options[highlightedIndex].value);
          close();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setHighlightedIndex(options.findIndex((o) => o.value === value));
        } else {
          setHighlightedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Escape':
        close();
        triggerRef.current?.focus();
        break;
      case 'Tab':
        close();
        break;
    }
  }

  const isDefault = variant === 'default';

  const triggerClass = [
    'flex items-center justify-between cursor-pointer focus:outline-none transition-colors',
    isDefault ? 'w-full' : '',
    SIZE_TRIGGER[size],
    isDefault
      ? [
          'bg-surface-2 border border-line text-text',
          RADIUS_TRIGGER[size],
          'hover:border-line-2',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          open ? 'border-accent ring-2 ring-accent' : '',
        ].join(' ')
      : 'bg-transparent text-text disabled:opacity-60 disabled:cursor-not-allowed',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={`relative ${isDefault ? 'w-full' : ''} ${className}`}
      onClick={onClick}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={triggerClass}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={`truncate ${!selectedOption && placeholder ? 'text-text-dim' : ''}`}>
          {selectedOption?.label ?? placeholder ?? ''}
        </span>
        <ChevronIcon
          className={`shrink-0 ${SIZE_CHEVRON[size]} text-text-dim transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-full min-w-[120px] overflow-hidden rounded-card border border-line bg-surface-2 shadow-overlay"
          onKeyDown={handleKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={[
                'flex cursor-pointer items-center justify-between transition-colors',
                SIZE_OPTION[size],
                index === highlightedIndex ? 'bg-surface-3' : 'hover:bg-surface-3',
                option.value === value ? 'text-accent' : 'text-text',
              ].join(' ')}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(option.value);
                close();
                triggerRef.current?.focus();
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <CheckIcon className="ml-2 size-3.5 shrink-0 text-accent" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
