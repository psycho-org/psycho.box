'use client';

import { useCallback } from 'react';
import type { RoadmapItemData } from './roadmap-types';
import { StatusPill } from './status-pill';
import type { StatusPillValue } from './status-pill';

export interface RoadmapItemProps {
  item: RoadmapItemData;
  onPeriodChange?: (id: string, startDate: string, endDate: string) => void;
  disabled?: boolean;
}

export function RoadmapItem({ item, onPeriodChange, disabled = false }: RoadmapItemProps) {
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.dataTransfer.setData('application/json', JSON.stringify(item));
      e.dataTransfer.effectAllowed = 'move';
      e.currentTarget.classList.add('opacity-60');
    },
    [item, disabled],
  );

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-60');
  }, []);

  const statusValue = (item.status ?? 'TODO') as StatusPillValue;

  return (
    <div
      draggable={!disabled && !!onPeriodChange}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        border border-line rounded-lg bg-surface p-2.5 grid gap-1.5
        ${onPeriodChange && !disabled ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      <p className="m-0 text-[13px] font-semibold truncate">{item.title}</p>
      <p className="m-0 text-xs text-text-soft">
        {item.startDate} ~ {item.endDate}
      </p>
      {item.status ? (
        <StatusPill value={statusValue} />
      ) : null}
      {item.assignee ? (
        <p className="m-0 text-xs text-text-dim truncate">{item.assignee}</p>
      ) : null}
      {onPeriodChange && !disabled ? (
        <p className="m-0 text-[10px] text-text-dim">드래그하여 기간 변경</p>
      ) : null}
    </div>
  );
}
