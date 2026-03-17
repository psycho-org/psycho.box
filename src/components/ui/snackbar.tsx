'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface SnackbarProps {
  open: boolean;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
  variant?: 'default' | 'success' | 'error';
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function Snackbar({
  open,
  message,
  onClose,
  autoHideDuration = 4000,
  variant = 'default',
}: SnackbarProps) {
  useEffect(() => {
    if (!open || autoHideDuration <= 0) return;
    const timer = setTimeout(onClose, autoHideDuration);
    return () => clearTimeout(timer);
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  const content = (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[280px] max-w-[90vw] ${
        variant === 'success'
          ? 'bg-green/10 border border-green/35'
          : variant === 'error'
            ? 'bg-red/10 border border-red/35'
            : 'bg-surface-2 border border-line'
      }`}
    >
      <span
        className={`flex-1 text-[14px] ${
          variant === 'success' ? 'text-green' : variant === 'error' ? 'text-red' : 'text-text'
        }`}
      >
        {message}
      </span>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 p-1 rounded hover:bg-surface-3 text-text-soft hover:text-text transition-colors"
        aria-label="닫기"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );

  return createPortal(content, document.body);
}
