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

  return (
    <div
      className="grid gap-2.5 max-lg:grid-cols-1"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
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
          className={`border border-line rounded-lg bg-surface p-2.5 grid gap-1.5 ${
            onCardClick ? 'cursor-pointer hover:border-line-2 focus:outline-2 focus:outline-accent focus:outline-offset-1' : ''
          }`}
        >
          {renderCard(item, idx)}
        </div>
      ))}
    </div>
  );
}
