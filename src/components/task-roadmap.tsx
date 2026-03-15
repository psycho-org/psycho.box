'use client';

import { useMemo, useState } from 'react';
import { TaskStatusDot } from '@/components/ui';
import type { TaskStatus } from '@/lib/task-status';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: { id: string; name: string } | null;
}

function parseTagsFromTitle(title: string): { tags: string[]; displayTitle: string } {
  const tags: string[] = [];
  let rest = title;
  const match = rest.match(/^(\[[A-Za-z0-9_-]+\]\s*)+/);
  if (match) {
    const prefix = match[0];
    rest = rest.slice(prefix.length).trim();
    const tagMatches = prefix.matchAll(/\[([A-Za-z0-9_-]+)\]/g);
    for (const m of tagMatches) tags.push(m[1]);
  }
  return { tags, displayTitle: rest || title };
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export interface TaskRoadmapProps {
  tasks: Task[];
  monthCount?: number;
}

export function TaskRoadmap({ tasks, monthCount = 2 }: TaskRoadmapProps) {
  const [monthOffset, setMonthOffset] = useState(0);

  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: Task[] = [];
    const unscheduled: Task[] = [];
    for (const t of tasks) {
      if (t.dueDate) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    }
    scheduled.sort((a, b) => {
      const da = a.dueDate!;
      const db = b.dueDate!;
      return da.localeCompare(db);
    });
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks]);

  const { startDate, endDate, dateColumns, monthLabels } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + monthOffset + monthCount, 0);

    const columns: { date: Date; key: string; isToday: boolean }[] = [];
    const labels = new Map<string, string>();
    const cur = new Date(start);

    while (cur <= end) {
      const key = toDateStr(cur);
      columns.push({
        date: new Date(cur),
        key,
        isToday: toDateStr(cur) === toDateStr(today),
      });
      const monthKey = `${cur.getFullYear()}-${cur.getMonth()}`;
      if (!labels.has(monthKey)) {
        labels.set(monthKey, cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      }
      cur.setDate(cur.getDate() + 1);
    }

    return {
      startDate: start,
      endDate: end,
      dateColumns: columns,
    };
  }, [monthOffset, monthCount]);

  const totalDays = dateColumns.length;

  const dayWidth = 24;

  function getBarStyle(task: Task): { left: number; width: number } | null {
    if (!task.dueDate) return null;
    const due = parseDateStr(task.dueDate.slice(0, 10));
    const start = parseDateStr(dateColumns[0]?.key ?? '');
    const end = parseDateStr(dateColumns[dateColumns.length - 1]?.key ?? '');
    if (due < start || due > end) return null;

    const dayIndex = daysBetween(start, due);
    const left = dayIndex * dayWidth;
    const width = Math.max(dayWidth, 48);
    return { left, width };
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface-2">
      <div className="flex min-w-0">
        {/* Left: Task list */}
        <div className="w-80 shrink-0 border-r border-line">
          <div className="sticky left-0 top-0 z-10 border-b border-line bg-surface-2 px-3 py-2.5">
            <p className="m-0 text-[12px] font-semibold text-text-dim uppercase">Title</p>
          </div>
          <div className="divide-y divide-line">
            {scheduledTasks.map((task, idx) => {
              const { displayTitle, tags } = parseTagsFromTitle(task.title);
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-2 px-3 py-2.5 min-h-[44px]"
                >
                  <span className="text-[11px] text-text-dim tabular-nums shrink-0 w-5">
                    {idx + 1}
                  </span>
                  <TaskStatusDot status={task.status} className="size-2.5 shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-[13px] font-medium text-text line-clamp-2">
                      {displayTitle}
                    </p>
                    {tags.length > 0 && (
                      <span className="text-[10px] text-text-dim">
                        {tags.map((t) => `[${t}]`).join(' ')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {unscheduledTasks.length > 0 && (
              <>
                <div className="px-3 py-2 bg-surface-3 border-t-2 border-line">
                  <p className="m-0 text-[11px] font-semibold text-text-dim uppercase">
                    Unscheduled ({unscheduledTasks.length})
                  </p>
                </div>
                {unscheduledTasks.map((task, idx) => {
                  const { displayTitle, tags } = parseTagsFromTitle(task.title);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-2 px-3 py-2.5 min-h-[44px] bg-surface-3/50"
                    >
                      <span className="text-[11px] text-text-dim tabular-nums shrink-0 w-5">
                        {scheduledTasks.length + idx + 1}
                      </span>
                      <TaskStatusDot status={task.status} className="size-2.5 shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="m-0 text-[13px] font-medium text-text line-clamp-2">
                          {displayTitle}
                        </p>
                        {tags.length > 0 && (
                          <span className="text-[10px] text-text-dim">
                            {tags.map((t) => `[${t}]`).join(' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Right: Timeline */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-2 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonthOffset((m) => m - 1)}
                className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim"
                aria-label="Previous month"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setMonthOffset((m) => m + 1)}
                className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim"
                aria-label="Next month"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
              <span className="text-[13px] font-medium text-text">
                {dateColumns[0]?.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {' – '}
                {dateColumns[dateColumns.length - 1]?.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Date headers */}
          <div
            className="flex border-b border-line bg-surface-2"
            style={{ width: totalDays * dayWidth }}
          >
            {dateColumns.map((col) => (
              <div
                key={col.key}
                className={`shrink-0 py-1.5 px-0.5 text-center text-[10px] border-r border-line last:border-r-0 ${
                  col.isToday ? 'bg-accent-dim text-accent-soft font-semibold' : 'text-text-dim'
                }`}
                style={{ width: dayWidth }}
              >
                {col.date.getDate()}
              </div>
            ))}
          </div>

          {/* Task bars */}
          <div className="relative" style={{ width: totalDays * dayWidth, minHeight: 44 * scheduledTasks.length }}>
            {scheduledTasks.map((task, idx) => {
              const style = getBarStyle(task);
              return (
                <div
                  key={task.id}
                  className="flex items-center border-b border-line min-h-[44px] relative"
                >
                  {style && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-6 rounded-md bg-accent/80 hover:bg-accent transition-colors cursor-pointer"
                      style={{
                        left: style.left + 4,
                        width: Math.min(style.width - 8, totalDays * dayWidth - style.left - 8),
                        minWidth: 20,
                      }}
                      title={task.dueDate ? new Date(task.dueDate).toLocaleDateString('ko-KR') : ''}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
