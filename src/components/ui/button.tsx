'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-accent text-white hover:bg-accent-soft',
  secondary: 'border-line bg-surface-2 text-text-soft hover:border-line-2 hover:text-text hover:bg-surface-3',
  ghost: 'border-transparent bg-transparent text-text-soft hover:bg-surface-2 hover:text-text',
  danger: 'border-transparent bg-red text-white hover:opacity-90',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading = false, disabled, className = '', children, ...props }, ref) => {
    const base = 'rounded-lg cursor-pointer font-[inherit] py-2.5 px-3.5 border inline-flex items-center justify-center gap-2 min-h-[40px] transition-colors';
    const variantClass = variantStyles[variant];
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`${base} ${variantClass} ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
            <span>처리 중...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
