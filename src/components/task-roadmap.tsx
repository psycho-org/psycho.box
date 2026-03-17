'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { TaskStatusDot } from '@/components/ui';
import type { TaskStatus } from '@/lib/task-status';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  sprintStartDate?: string | null;
  sprintEndDate?: string | null;
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
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function normalizeDateKey(value?: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function getTaskAlertType(
  task: Task,
  sprintEndDate?: string | null,
): 'overdue' | 'sprint-ended' | null {
  const isDone = task.status === 'DONE' || task.status === 'CANCELLED';
  if (isDone) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = task.dueDate && new Date(task.dueDate) < today;
  if (overdue) return 'overdue';

  const sprintEnded = sprintEndDate && new Date(sprintEndDate) < today;
  if (sprintEnded) return 'sprint-ended';

  return null;
}

/** 기한 지남 표시: 은은한 배경 */
const ALERT_BG = {
  overdue: 'bg-[rgba(232,165,74,0.06)]',
  'sprint-ended': 'bg-[rgba(217,107,107,0.06)]',
} as const;
const ALERT_BAR_COLOR = {
  overdue: 'bg-[#e8a54a]/85 hover:bg-[#e8a54a]',
  'sprint-ended': 'bg-[#d96b6b]/85 hover:bg-[#d96b6b]',
} as const;

export interface TaskRoadmapProps {
  tasks: Task[];
  monthCount?: number;
  /** 스프린트 종료일 (빨간색 표시용) */
  sprintEndDate?: string | null;
  /** 로드맵에서 날짜 이동 시 호출 (YYYY-MM-DD) */
  onTaskDueDateChange?: (taskId: string, dueDate: string) => Promise<void> | void;
  /** 태스크 클릭 시 호출 */
  onTaskClick?: (task: Task) => void;
}

const EDGE_THRESHOLD = 24;
const EDGE_DWELL_MS = 450;
const MAX_MONTH_COUNT = 12;
const ROADMAP_ROW_HEIGHT = 56;
const ROADMAP_SECTION_HEADER_HEIGHT = 37;


function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
export function TaskRoadmap({
  tasks,
  monthCount: initialMonthCount = 2,
  sprintEndDate,
  onTaskDueDateChange,
  onTaskClick,
}: TaskRoadmapProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [monthCount, setMonthCount] = useState(initialMonthCount);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ rowTaskId: string; dateKey: string } | null>(null);
  const [unscheduledHover, setUnscheduledHover] = useState<{
    taskId: string;
    dateKey: string;
  } | null>(null);
  const [addingDueDateTaskId, setAddingDueDateTaskId] = useState<string | null>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const pendingPrependWidthRef = useRef<number>(0);
  const isSyncingHScrollRef = useRef(false);
  const pendingScrollToEndRef = useRef(false);
  const isRestoringScrollRef = useRef(false);
  const edgeDwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const edgeDirectionRef = useRef<'left' | 'right' | null>(null);

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
    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [tasks]);

  const { startDate, endDate, dateColumns } = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + monthOffset + monthCount, 0);

    const columns: { date: Date; key: string; isToday: boolean }[] = [];
    const cur = new Date(start);

    while (cur <= end) {
      const key = toDateStr(cur);
      columns.push({
        date: new Date(cur),
        key,
        isToday: toDateStr(cur) === toDateStr(today),
      });
      cur.setDate(cur.getDate() + 1);
    }

    return {
      startDate: start,
      endDate: end,
      dateColumns: columns,
    };
  }, [monthOffset, monthCount]);

  const monthGroups = useMemo(() => {
    const groups: { key: string; label: string; columns: typeof dateColumns }[] = [];
    let current: { key: string; label: string; columns: typeof dateColumns } | null = null;

    for (const col of dateColumns) {
      const key = `${col.date.getFullYear()}-${col.date.getMonth()}`;
      const label = col.date.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });
      if (!current || current.key !== key) {
        current = { key, label, columns: [] };
        groups.push(current);
      }
      current.columns.push(col);
    }
    return groups;
  }, [dateColumns]);

  const dayWidth = 24;
  const totalDays = dateColumns.length;
  const timelineWidth = totalDays * dayWidth;
  const todayLineOffset = useMemo(() => {
    const todayIndex = dateColumns.findIndex((col) => col.isToday);
    if (todayIndex < 0) return null;
    return todayIndex * dayWidth + dayWidth / 2;
  }, [dateColumns, dayWidth]);

  const syncHorizontalScrollToHeader = useCallback(() => {
    if (isSyncingHScrollRef.current) return;
    const timeline = timelineScrollRef.current;
    const header = headerScrollRef.current;
    if (!timeline || !header) return;
    isSyncingHScrollRef.current = true;
    header.scrollLeft = timeline.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingHScrollRef.current = false;
    });
  }, []);
  const syncHorizontalScrollToTimeline = useCallback(() => {
    if (isSyncingHScrollRef.current) return;
    const timeline = timelineScrollRef.current;
    const header = headerScrollRef.current;
    if (!timeline || !header) return;
    isSyncingHScrollRef.current = true;
    timeline.scrollLeft = header.scrollLeft;
    requestAnimationFrame(() => {
      isSyncingHScrollRef.current = false;
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (isRestoringScrollRef.current) return;
    const el = timelineScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;

    const atLeftEdge = scrollLeft < EDGE_THRESHOLD && monthCount < MAX_MONTH_COUNT && dateColumns.length > 0;
    const atRightEdge = scrollLeft > maxScroll - EDGE_THRESHOLD && monthCount < MAX_MONTH_COUNT;

    if (atLeftEdge) {
      if (edgeDirectionRef.current !== 'left') {
        edgeDirectionRef.current = 'left';
        if (edgeDwellTimerRef.current) clearTimeout(edgeDwellTimerRef.current);
        edgeDwellTimerRef.current = setTimeout(() => {
          edgeDwellTimerRef.current = null;
          edgeDirectionRef.current = null;
          const first = dateColumns[0]!;
          const prevMonthDays = new Date(first.date.getFullYear(), first.date.getMonth(), 0).getDate();
          pendingPrependWidthRef.current = prevMonthDays * dayWidth;
          setMonthOffset((m) => m - 1);
          setMonthCount((c) => Math.min(c + 1, MAX_MONTH_COUNT));
        }, EDGE_DWELL_MS);
      }
    } else if (atRightEdge) {
      if (edgeDirectionRef.current !== 'right') {
        edgeDirectionRef.current = 'right';
        if (edgeDwellTimerRef.current) clearTimeout(edgeDwellTimerRef.current);
        edgeDwellTimerRef.current = setTimeout(() => {
          edgeDwellTimerRef.current = null;
          edgeDirectionRef.current = null;
          pendingScrollToEndRef.current = true;
          setMonthCount((c) => Math.min(c + 1, MAX_MONTH_COUNT));
        }, EDGE_DWELL_MS);
      }
    } else {
      if (edgeDwellTimerRef.current) {
        clearTimeout(edgeDwellTimerRef.current);
        edgeDwellTimerRef.current = null;
      }
      edgeDirectionRef.current = null;
    }
  }, [monthCount, dateColumns, dayWidth]);

  useEffect(() => {
    return () => {
      if (edgeDwellTimerRef.current) clearTimeout(edgeDwellTimerRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    const el = timelineScrollRef.current;
    const prepend = pendingPrependWidthRef.current;
    const scrollToEnd = pendingScrollToEndRef.current;
    if (el && prepend > 0) {
      pendingPrependWidthRef.current = 0;
      isRestoringScrollRef.current = true;
      el.scrollLeft = el.scrollLeft + prepend;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isRestoringScrollRef.current = false;
        });
      });
    } else if (el && scrollToEnd) {
      pendingScrollToEndRef.current = false;
      isRestoringScrollRef.current = true;
      el.scrollLeft = el.scrollWidth - el.clientWidth;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isRestoringScrollRef.current = false;
        });
      });
    }
  });

  const getAllowedRangeForTask = useCallback((task: Task) => {
    const startKey = normalizeDateKey(task.sprintStartDate);
    const endKey = normalizeDateKey(task.sprintEndDate);
    return { startKey, endKey };
  }, []);

  const isDateAllowedForTask = useCallback(
    (task: Task, dateKey: string) => {
      const { startKey, endKey } = getAllowedRangeForTask(task);
      if (startKey && dateKey < startKey) return false;
      if (endKey && dateKey > endKey) return false;
      return true;
    },
    [getAllowedRangeForTask],
  );

  const getUnavailableSegments = useCallback(
    (task: Task) => {
      const { startKey, endKey } = getAllowedRangeForTask(task);
      if (!startKey && !endKey) return [];
      if (dateColumns.length === 0) return [];

      const viewStartKey = dateColumns[0]?.key;
      const viewEndKey = dateColumns[dateColumns.length - 1]?.key;
      if (!viewStartKey || !viewEndKey) return [];

      const segments: Array<{ left: number; width: number }> = [];
      if (startKey && startKey > viewStartKey) {
        const disabledDaysBefore = Math.min(daysBetween(parseDateStr(viewStartKey), parseDateStr(startKey)), totalDays);
        if (disabledDaysBefore > 0) {
          segments.push({ left: 0, width: disabledDaysBefore * dayWidth });
        }
      }
      if (endKey && endKey < viewEndKey) {
        const disabledStartIndex = Math.max(daysBetween(parseDateStr(viewStartKey), parseDateStr(endKey)) + 1, 0);
        if (disabledStartIndex < totalDays) {
          segments.push({
            left: disabledStartIndex * dayWidth,
            width: timelineWidth - disabledStartIndex * dayWidth,
          });
        }
      }
      return segments.filter((segment) => segment.width > 0);
    },
    [dateColumns, dayWidth, getAllowedRangeForTask, timelineWidth, totalDays],
  );

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

  function getDateKeyFromPointer(clientX: number, currentTarget: HTMLDivElement): string | null {
    if (dateColumns.length === 0) return null;
    const rect = currentTarget.getBoundingClientRect();
    const localX = clientX - rect.left;
    const clampedX = Math.min(Math.max(localX, 0), totalDays * dayWidth - 1);
    const dayIndex = Math.floor(clampedX / dayWidth);
    return dateColumns[dayIndex]?.key ?? null;
  }

  function handleTimelineBarDragStart(event: React.DragEvent<HTMLDivElement>, taskId: string) {
    if (!onTaskDueDateChange) return;
    setDraggingTaskId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
  }

  function handleTimelineBarDragEnd() {
    setDraggingTaskId(null);
    setDragOver(null);
  }

  function handleTimelineRowDragOver(event: React.DragEvent<HTMLDivElement>, rowTaskId: string) {
    if (!onTaskDueDateChange) return;
    const taskId = draggingTaskId || event.dataTransfer.getData('text/plain');
    if (!taskId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const dateKey = getDateKeyFromPointer(event.clientX, event.currentTarget);
    if (!dateKey) return;
    const draggedTask = tasks.find((task) => task.id === taskId);
    if (draggedTask && !isDateAllowedForTask(draggedTask, dateKey)) {
      setDragOver((prev) => (prev?.rowTaskId === rowTaskId ? null : prev));
      return;
    }
    setDragOver({ rowTaskId, dateKey });
  }

  function handleTimelineRowDragLeave(event: React.DragEvent<HTMLDivElement>, rowTaskId: string) {
    const next = event.relatedTarget as Node | null;
    if (next && event.currentTarget.contains(next)) return;
    setDragOver((prev) => (prev?.rowTaskId === rowTaskId ? null : prev));
  }

  async function handleTimelineRowDrop(event: React.DragEvent<HTMLDivElement>, rowTaskId: string) {
    if (!onTaskDueDateChange) return;
    event.preventDefault();

    const taskId = draggingTaskId || event.dataTransfer.getData('text/plain');
    const dateKey =
      getDateKeyFromPointer(event.clientX, event.currentTarget) ??
      (dragOver?.rowTaskId === rowTaskId ? dragOver.dateKey : null);

    setDraggingTaskId(null);
    setDragOver(null);

    if (!taskId || !dateKey) return;
    const draggedTask = tasks.find((task) => task.id === taskId);
    if (draggedTask && !isDateAllowedForTask(draggedTask, dateKey)) return;
    await onTaskDueDateChange(taskId, dateKey);
  }

  function handleUnscheduledRowMouseMove(
    event: React.MouseEvent<HTMLDivElement>,
    taskId: string,
  ) {
    if (!onTaskDueDateChange) return;
    if (addingDueDateTaskId) return;
    const dateKey = getDateKeyFromPointer(event.clientX, event.currentTarget);
    if (!dateKey) return;
    const hoveredTask = tasks.find((item) => item.id === taskId);
    if (hoveredTask && !isDateAllowedForTask(hoveredTask, dateKey)) {
      setUnscheduledHover((prev) => (prev?.taskId === taskId ? null : prev));
      return;
    }
    setUnscheduledHover((prev) => {
      if (prev?.taskId === taskId && prev.dateKey === dateKey) return prev;
      return { taskId, dateKey };
    });
  }

  function handleUnscheduledRowMouseLeave(taskId: string) {
    setUnscheduledHover((prev) => (prev?.taskId === taskId ? null : prev));
  }

  async function handleAddDueDate(
    event: React.MouseEvent<HTMLButtonElement>,
    taskId: string,
    dateKey: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    if (!onTaskDueDateChange) return;
    const task = tasks.find((item) => item.id === taskId);
    if (task && !isDateAllowedForTask(task, dateKey)) return;
    setAddingDueDateTaskId(taskId);
    try {
      await onTaskDueDateChange(taskId, dateKey);
      setUnscheduledHover((prev) => (prev?.taskId === taskId ? null : prev));
    } finally {
      setAddingDueDateTaskId((prev) => (prev === taskId ? null : prev));
    }
  }

  return (
    <div className="flex flex-col h-[480px] min-h-0 rounded-2xl border border-line/60 bg-surface overflow-hidden">
      {/* 월 네비게이션 */}
      <div className="shrink-0 flex items-center gap-2 border-b border-line px-3 py-2 bg-surface">
        <button
          type="button"
          onClick={() => setMonthOffset((m) => m - 1)}
          className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim"
          aria-label="이전 달"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setMonthOffset((m) => m + 1)}
          className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim"
          aria-label="다음 달"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
        <span className="text-[13px] font-medium text-text">
          {dateColumns[0]?.date.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })}
          {' – '}
          {dateColumns[dateColumns.length - 1]?.date.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      {/* 본문: 헤더 고정, 세로 스크롤은 우측(타임라인)에만 */}
      <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        {/* 헤더 행 */}
        <div className="flex shrink-0 border-b border-line bg-surface">
          <div className="flex items-center justify-center px-3 py-2 w-80 shrink-0 min-w-80 border-r border-line bg-surface min-h-[56px]">
            <p className="m-0 text-[12px] font-semibold text-text-dim uppercase">제목</p>
          </div>
          <div
            ref={headerScrollRef}
            className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden"
            onScroll={syncHorizontalScrollToTimeline}
          >
            <div
              className="flex flex-col shrink-0 bg-surface"
              style={{ width: totalDays * dayWidth, minWidth: totalDays * dayWidth }}
            >
              <div
                className="flex border-b border-line bg-surface shrink-0"
                style={{ width: totalDays * dayWidth, minWidth: totalDays * dayWidth }}
              >
                {monthGroups.map((group) => (
                  <div
                    key={group.key}
                    className="shrink-0 flex items-center justify-center py-1.5 px-2 text-[11px] font-medium text-text border-r border-line bg-surface last:border-r-0"
                    style={{ width: group.columns.length * dayWidth, minWidth: group.columns.length * dayWidth }}
                  >
                    {group.label}
                  </div>
                ))}
              </div>
              <div
                className="flex border-b-0 border-line bg-surface shrink-0"
                style={{ width: totalDays * dayWidth, minWidth: totalDays * dayWidth }}
              >
                {dateColumns.map((col) => (
                  <div
                    key={col.key}
                    className={`shrink-0 py-1.5 px-0.5 text-center text-[10px] border-r border-line last:border-r-0 ${
                      col.isToday ? 'bg-accent-dim text-accent-soft font-semibold' : 'text-text-dim'
                    }`}
                    style={{ width: dayWidth, minWidth: dayWidth }}
                  >
                    {col.date.getDate()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* 세로 스크롤: Task 목록 + 타임라인 (스크롤바 우측) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="flex">
            <div className="w-80 shrink-0 border-r border-line bg-surface">
              <div className="divide-y divide-line">
            {scheduledTasks.map((task, idx) => {
              const { displayTitle, tags } = parseTagsFromTitle(task.title);
              const alertType = getTaskAlertType(task, sprintEndDate);
              return (
                <div
                  key={task.id}
                  className={`flex h-[56px] items-start gap-2 overflow-hidden px-3 py-2.5 ${alertType ? ALERT_BG[alertType] : ''} ${onTaskClick ? 'cursor-pointer hover:bg-blue/5' : ''}`}
                  onClick={() => onTaskClick?.(task)}
                  role={onTaskClick ? 'button' : undefined}
                  tabIndex={onTaskClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onTaskClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onTaskClick(task);
                    }
                  }}
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
                <div className="px-3 py-2 bg-surface border-t-2 border-line">
                  <p className="m-0 text-[11px] font-semibold text-text-dim uppercase">
                    미지정 일정 ({unscheduledTasks.length})
                  </p>
                </div>
                {unscheduledTasks.map((task, idx) => {
                  const { displayTitle, tags } = parseTagsFromTitle(task.title);
                  const alertType = getTaskAlertType(task, sprintEndDate);
                  return (
                    <div
                      key={task.id}
                      className={`flex h-[56px] items-start gap-2 overflow-hidden px-3 py-2.5 bg-surface ${alertType ? ALERT_BG[alertType] : ''} ${onTaskClick ? 'cursor-pointer hover:bg-blue/5' : ''}`}
                      onClick={() => onTaskClick?.(task)}
                      role={onTaskClick ? 'button' : undefined}
                      tabIndex={onTaskClick ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (onTaskClick && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          onTaskClick(task);
                        }
                      }}
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
            {/* 우측: 타임라인 (가로 스크롤, 헤더와 동기화) */}
            <div
              ref={timelineScrollRef}
              className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden"
              onScroll={() => {
                handleScroll();
                syncHorizontalScrollToHeader();
              }}
            >
              <div
                className="relative shrink-0"
                style={{
                  width: totalDays * dayWidth,
                  minWidth: totalDays * dayWidth,
                  minHeight:
                    ROADMAP_ROW_HEIGHT * (scheduledTasks.length + unscheduledTasks.length) +
                    (unscheduledTasks.length > 0 ? ROADMAP_SECTION_HEADER_HEIGHT : 0),
                }}
              >
            {todayLineOffset !== null ? (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 z-20 -translate-x-1/2 border-l border-accent/25"
                style={{ left: todayLineOffset }}
              />
            ) : null}
            {scheduledTasks.map((task, idx) => {
              const style = getBarStyle(task);
              const alertType = getTaskAlertType(task, sprintEndDate);
              const dragOverDayIndex =
                dragOver?.rowTaskId === task.id
                  ? dateColumns.findIndex((col) => col.key === dragOver.dateKey)
                  : -1;
              const dragOverLeft = dragOverDayIndex >= 0 ? dragOverDayIndex * dayWidth : null;
              const barColor =
                alertType === 'overdue'
                  ? ALERT_BAR_COLOR['overdue']
                  : alertType === 'sprint-ended'
                    ? ALERT_BAR_COLOR['sprint-ended']
                    : 'bg-accent/80 hover:bg-accent';
              return (
                <div
                  key={task.id}
                  className="relative flex h-[56px] items-center border-b border-line"
                  onDragOver={(event) => handleTimelineRowDragOver(event, task.id)}
                  onDragLeave={(event) => handleTimelineRowDragLeave(event, task.id)}
                  onDrop={(event) => {
                    void handleTimelineRowDrop(event, task.id);
                  }}
                >
                  {getUnavailableSegments(task).map((segment, index) => (
                    <span
                      key={`${task.id}-scheduled-disabled-${index}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 z-0 bg-surface-3/55"
                      style={{ left: segment.left, width: segment.width }}
                    />
                  ))}
                  {dragOverLeft !== null ? (
                    <>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 z-10 bg-accent-dim/40"
                        style={{ left: dragOverLeft, width: dayWidth }}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 z-20 border-l border-accent/60"
                        style={{ left: dragOverLeft + dayWidth / 2 }}
                      />
                    </>
                  ) : null}
                  {style && (
                    <div
                      draggable={!!onTaskDueDateChange}
                      onDragStart={(event) => handleTimelineBarDragStart(event, task.id)}
                      onDragEnd={handleTimelineBarDragEnd}
                      className={`absolute top-1/2 -translate-y-1/2 h-6 rounded-md ${barColor} transition-colors ${
                        onTaskDueDateChange ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${draggingTaskId === task.id ? 'opacity-60' : ''}`}
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
            {unscheduledTasks.length > 0 ? (
              <div
                className="border-t-2 border-b border-line bg-surface"
                style={{ height: ROADMAP_SECTION_HEADER_HEIGHT }}
              />
            ) : null}
            {unscheduledTasks.map((task) => {
              const alertType = getTaskAlertType(task, sprintEndDate);
              const hoveredDateKey =
                unscheduledHover?.taskId === task.id ? unscheduledHover.dateKey : null;
              const hoverDayIndex = hoveredDateKey
                ? dateColumns.findIndex((col) => col.key === hoveredDateKey)
                : -1;
              const hoverLeft = hoverDayIndex >= 0 ? hoverDayIndex * dayWidth : null;
              const isAddingDueDate = addingDueDateTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className={`relative flex h-[56px] items-center border-b border-line ${
                    alertType ? ALERT_BG[alertType] : ''
                  } ${onTaskDueDateChange ? 'cursor-cell' : ''}`}
                  onMouseMove={(event) => handleUnscheduledRowMouseMove(event, task.id)}
                  onMouseLeave={() => handleUnscheduledRowMouseLeave(task.id)}
                >
                  {getUnavailableSegments(task).map((segment, index) => (
                    <span
                      key={`${task.id}-unscheduled-disabled-${index}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 z-0 bg-surface-3/55"
                      style={{ left: segment.left, width: segment.width }}
                    />
                  ))}
                  {hoverLeft !== null && hoveredDateKey && onTaskDueDateChange ? (
                    <button
                      type="button"
                      className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-md border border-dashed border-text-dim/50 bg-surface-2/80 text-text-dim hover:text-text hover:border-text-dim transition-colors flex items-center justify-center ${
                        isAddingDueDate ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                      }`}
                      style={{
                        left: hoverLeft + 2,
                        width: Math.max(18, dayWidth - 4),
                      }}
                      onClick={(event) => {
                        void handleAddDueDate(event, task.id, hoveredDateKey);
                      }}
                      disabled={isAddingDueDate}
                      aria-label={`${hoveredDateKey}에 마감일 추가`}
                      title={`${hoveredDateKey}에 마감일 추가`}
                    >
                      {isAddingDueDate ? (
                        <span className="text-[11px] leading-none">…</span>
                      ) : (
                        <PlusIcon className="size-3.5" />
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
