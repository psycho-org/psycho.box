'use client';

import { useCallback, useMemo, useState } from 'react';
import { RoadmapItem } from './roadmap-item';
import type { RoadmapItemData, PeriodChangePayload } from './roadmap-types';
import { addDays, daysBetween, formatDate, parseDate } from './roadmap-utils';

export interface RoadmapProps {
  items: RoadmapItemData[];
  onPeriodChange?: (payload: PeriodChangePayload) => void;
  startDate?: string;  // YYYY-MM-DD
  weekCount?: number;
}

export function Roadmap({
  items,
  onPeriodChange,
  startDate: propStartDate,
  weekCount = 4,
}: RoadmapProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const startDate = useMemo(() => {
    if (propStartDate) return parseDate(propStartDate);
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    return monday;
  }, [propStartDate]);

  const weekDates = useMemo(() => {
    const dates: { date: Date; key: string }[] = [];
    for (let w = 0; w < weekCount; w++) {
      for (let d = 0; d < 7; d++) {
        const date = addDays(startDate, w * 7 + d);
        dates.push({ date, key: formatDate(date) });
      }
    }
    return dates;
  }, [startDate, weekCount]);

  const todayKey = useMemo(() => formatDate(new Date()), []);

  const handleDragOver = useCallback((e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropDateStr: string) => {
      e.preventDefault();
      setDragOverCell(null);

      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;

      let item: RoadmapItemData;
      try {
        item = JSON.parse(raw) as RoadmapItemData;
      } catch {
        return;
      }

      const dropDate = parseDate(dropDateStr);
      const oldStart = parseDate(item.startDate);
      const oldEnd = parseDate(item.endDate);
      const durationDays = daysBetween(oldStart, oldEnd);

      const newStartDate = formatDate(dropDate);
      const newEndDate = formatDate(addDays(dropDate, durationDays));

      onPeriodChange?.({
        id: item.id,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    },
    [onPeriodChange],
  );

  const dayLabels = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* 헤더: 요일 */}
        <div className="grid grid-cols-7 border-b border-line bg-surface-2">
          {dayLabels.map((label) => (
            <div key={label} className="py-2 px-1 text-center text-[11px] text-text-dim uppercase">
              {label}
            </div>
          ))}
        </div>

        {/* 타임라인 드롭 영역: 각 셀에 드롭하면 해당 날짜를 시작일로 기간 변경 */}
        <div className="grid grid-cols-7 border-b border-line">
          {weekDates.map(({ date, key }) => (
            <div
              key={key}
              onDragOver={(e) => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, key)}
              className={`
                relative min-h-[100px] p-2 border-r border-line last:border-r-0
                transition-colors
                ${dragOverCell === key ? 'bg-accent-dim ring-1 ring-accent' : 'bg-surface-2/30 hover:bg-surface-2/50'}
              `}
            >
              {key === todayKey ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-accent/30"
                />
              ) : null}
              <span className="text-[10px] text-text-dim block mb-1">{date.getDate()}</span>
              {dragOverCell === key ? (
                <span className="text-[10px] text-accent-soft">여기에 놓기</span>
              ) : null}
            </div>
          ))}
        </div>

        {/* 드래그 가능한 아이템 목록 */}
        <div className="mt-4">
          <p className="m-0 mb-2 text-[11px] text-text-dim">
            아이템을 위 타임라인 셀에 드래그하여 놓으면 기간이 변경됩니다.
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <RoadmapItem
                key={item.id}
                item={item}
                onPeriodChange={
                  onPeriodChange
                    ? (id, startDate, endDate) =>
                        onPeriodChange({ id, startDate, endDate })
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
