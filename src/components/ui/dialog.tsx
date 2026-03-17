'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-2 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[calc(100svh-0.5rem)] w-full max-w-[420px] overflow-y-auto rounded-[20px] border border-line bg-surface p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:max-h-[calc(100svh-2rem)] sm:rounded-[14px] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="dialog-title" className="m-0 mb-4 text-lg font-semibold">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
