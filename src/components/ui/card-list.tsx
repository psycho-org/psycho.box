'use client';

export interface CardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onCardClick?: (item: T, index: number) => void;
  getItemId?: (item: T) => string;
  columns?: number;
  emptyMessage?: string;
}

export function CardList<T>({
  items,
  renderCard,
  onCardClick,
  getItemId,
  columns = 3,
  emptyMessage = '항목이 없습니다.',
}: CardListProps<T>) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-text-soft text-[13px]">
        {emptyMessage}
      </p>
    );
  }

  const gridColsClass =
    columns === 2 ? 'lg:grid-cols-2' : columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2';

  return (
    <div className={`grid gap-2.5 grid-cols-1 ${gridColsClass}`}>
      {items.map((item, idx) => (
        <div
          key={getItemId ? getItemId(item) : idx}
          role={onCardClick ? 'button' : undefined}
          tabIndex={onCardClick ? 0 : undefined}
          onClick={() => onCardClick?.(item, idx)}
          onKeyDown={(e) => {
            if (onCardClick && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onCardClick(item, idx);
            }
          }}
          className={`border border-line rounded-lg bg-surface p-2.5 grid gap-1.5 transition-all duration-200 ${
            onCardClick ? 'cursor-pointer hover:bg-surface-2/60 hover:scale-[1.01] hover:shadow-sm' : ''
          }`}
        >
          {renderCard(item, idx)}
        </div>
      ))}
    </div>
  );
}
