'use client';

export type StatusPillValue =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'CLOSED'
  | 'BACKLOG'
  | 'PLANNING'
  | 'PAUSE'
  | 'CANCELED';

export interface StatusPillProps {
  value: StatusPillValue;
  onClick?: () => void;
  className?: string;
}

const statusStyles: Record<StatusPillValue, string> = {
  TODO: 'border-yellow/30 bg-yellow/10 text-[#f5dfac]',
  IN_PROGRESS: 'border-blue/30 bg-blue/15 text-[#b7e5ff]',
  DONE: 'border-green/30 bg-green/15 text-[#b1f1d2]',
  CANCELLED: 'border-line-2 bg-surface-3 text-text-dim',
  ACTIVE: 'border-green/30 bg-green/15 text-[#b1f1d2]',
  CLOSED: 'border-line-2 bg-surface-3 text-text-dim',
  BACKLOG: 'border-line bg-surface-2 text-text-soft',
  PLANNING: 'border-orange/30 bg-orange/15 text-[#ffd4b8]',
  PAUSE: 'border-orange/30 bg-orange/15 text-[#ffd4b8]',
  CANCELED: 'border-line-2 bg-surface-3 text-text-dim',
};

function formatLabel(value: StatusPillValue): string {
  return value.replace(/_/g, ' ');
}

export function StatusPill({ value, onClick, className = '' }: StatusPillProps) {
  const style = statusStyles[value] ?? 'border-line bg-surface-2 text-text-soft';
  const base = 'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium';
  const interactive = onClick ? 'cursor-pointer hover:opacity-90' : '';

  const content = (
    <span className={`${base} ${style} ${interactive} ${className}`}>
      {formatLabel(value)}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="border-0 bg-transparent p-0 font-inherit">
        {content}
      </button>
    );
  }

  return content;
}
