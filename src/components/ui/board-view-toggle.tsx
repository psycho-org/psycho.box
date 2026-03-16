'use client';

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CardGridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

export type BoardViewDisplayMode = 'list' | 'kanban' | 'card';

export interface BoardViewToggleProps {
  value: BoardViewDisplayMode;
  onChange: (value: BoardViewDisplayMode) => void;
  listLabel?: string;
  kanbanLabel?: string;
  cardLabel?: string;
  className?: string;
}

export function BoardViewToggle({
  value,
  onChange,
  listLabel = '리스트',
  kanbanLabel = '칸반',
  cardLabel = '카드',
  className = '',
}: BoardViewToggleProps) {
  return (
    <div
      className={`inline-flex shrink-0 rounded-full p-0.5 bg-surface-2/80 backdrop-blur-sm ${className}`}
      role="group"
      aria-label="보기 방식 선택"
    >
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`shrink-0 size-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          value === 'list'
            ? 'bg-surface-3 text-text shadow-sm ring-1 ring-line/50'
            : 'text-text-dim hover:text-text-soft hover:bg-surface-3/50'
        }`}
        title={listLabel}
        aria-pressed={value === 'list'}
      >
        <ListIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('kanban')}
        className={`shrink-0 size-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          value === 'kanban'
            ? 'bg-surface-3 text-text shadow-sm ring-1 ring-line/50'
            : 'text-text-dim hover:text-text-soft hover:bg-surface-3/50'
        }`}
        title={kanbanLabel}
        aria-pressed={value === 'kanban'}
      >
        <GridIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={`shrink-0 size-8 flex items-center justify-center rounded-full transition-all duration-200 ${
          value === 'card'
            ? 'bg-surface-3 text-text shadow-sm ring-1 ring-line/50'
            : 'text-text-dim hover:text-text-soft hover:bg-surface-3/50'
        }`}
        title={cardLabel}
        aria-pressed={value === 'card'}
      >
        <CardGridIcon className="size-4" />
      </button>
    </div>
  );
}
