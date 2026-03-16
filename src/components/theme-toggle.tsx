'use client';

import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, setStoredTheme, type Theme } from '@/lib/theme';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

export interface ThemeModeToggleProps {
  value: Theme;
  onChange: (value: Theme) => void;
  lightLabel?: string;
  darkLabel?: string;
  className?: string;
}

/** 리스트/칸반 토글처럼 밝음·어두움 두 옵션을 함께 보여주고 선택 */
export function ThemeModeToggle({
  value,
  onChange,
  lightLabel = '밝은 모드',
  darkLabel = '어두운 모드',
  className = '',
}: ThemeModeToggleProps) {
  return (
    <div
      className={`inline-flex shrink-0 rounded-full p-0.5 bg-surface-2/80 backdrop-blur-sm ${className}`}
      role="group"
      aria-label="테마 선택"
    >
      <button
        type="button"
        onClick={() => onChange('light')}
        className={`shrink-0 size-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          value === 'light'
            ? 'bg-surface-3 text-text shadow-sm ring-1 ring-line/50'
            : 'text-text-dim hover:text-text-soft hover:bg-surface-3/50'
        }`}
        title={lightLabel}
        aria-pressed={value === 'light'}
      >
        <SunIcon className="size-4 shrink-0" />
      </button>
      <button
        type="button"
        onClick={() => onChange('dark')}
        className={`shrink-0 size-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          value === 'dark'
            ? 'bg-surface-3 text-text shadow-sm ring-1 ring-line/50'
            : 'text-text-dim hover:text-text-soft hover:bg-surface-3/50'
        }`}
        title={darkLabel}
        aria-pressed={value === 'dark'}
      >
        <MoonIcon className="size-4 shrink-0" />
      </button>
    </div>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function handleChange(next: Theme) {
    setTheme(next);
    setStoredTheme(next);
    applyTheme(next);
  }

  return (
    <ThemeModeToggle
      value={theme}
      onChange={handleChange}
      className={className}
    />
  );
}
