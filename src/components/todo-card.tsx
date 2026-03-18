'use client';

import type { TaskStatus } from '@/lib/task-status';
import { TASK_STATUS_COLORS } from '@/lib/task-status';

function colorFromId(id: string): string {
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export interface TodoCardAssignee {
  id: string;
  name: string;
}

export interface TodoCardTask {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: TodoCardAssignee | null;
  /** 여러 담당자 (겹쳐 표시, 호버 시 리스트) */
  assignees?: TodoCardAssignee[];
  tags?: string[];
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

function getDueDateAlertType(
  task: TodoCardTask,
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

export interface TodoCardProps {
  task: TodoCardTask;
  sprintEndDate?: string | null;
  statusBarColor?: string;
  className?: string;
}

/**
 * 상단 전체 너비 상태바, 제목, 하단 왼쪽 마감일(급함 표시), 오른쪽 담당자 아바타(여러명 겹침)
 */
export function TodoCard({ task, sprintEndDate, statusBarColor, className = '' }: TodoCardProps) {
  const { displayTitle } = parseTagsFromTitle(task.title);
  const barColor = statusBarColor ?? TASK_STATUS_COLORS[task.status] ?? 'var(--color-accent)';
  const alertType = getDueDateAlertType(task, sprintEndDate);

  const people = task.assignees?.length
    ? task.assignees
    : task.assignee
      ? [task.assignee]
      : [];

  const dueDateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' })
    : null;

  const dueDateColor =
    alertType === 'overdue'
      ? 'text-[#e8a54a]'
      : alertType === 'sprint-ended'
        ? 'text-[#d96b6b]'
        : 'text-text-dim';

  return (
    <div
      className={`rounded-xl border border-line/40 bg-surface shadow-sm overflow-hidden ${className}`}
    >
      {/* 상단 좌측 정렬 상태 바 */}
      <div
        className="h-1 w-12 shrink-0 rounded-r"
        style={{ backgroundColor: barColor }}
        aria-hidden
      />
      {/* 본문 */}
      <div className="p-3">
        <p className="m-0 min-h-[2.5rem] break-words text-[13px] font-medium text-text line-clamp-2">
          {displayTitle}
        </p>
        {/* 하단: 마감일(급함 아이콘) | 담당자 아바타들 */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-1.5">
            {dueDateLabel && (
              <span
                className={`inline-flex min-w-0 items-center gap-1 text-[11px] font-medium ${dueDateColor}`}
                title={alertType === 'overdue' ? '마감일 지남' : alertType === 'sprint-ended' ? '스프린트 종료' : undefined}
              >
                {alertType ? (
                  alertType === 'overdue' ? (
                    <ClockIcon className="size-3.5 shrink-0" />
                  ) : (
                    <AlertIcon className="size-3.5 shrink-0" />
                  )
                ) : (
                  <ClockIcon className="size-3.5 shrink-0 opacity-60" />
                )}
                <span className="truncate leading-none">{dueDateLabel}</span>
              </span>
            )}
          </div>
          {/* 담당자 아바타 (여러명 겹침, 호버 시 리스트) */}
          {people.length > 0 && (
            <div
              className="relative group shrink-0 self-start sm:self-auto"
              title={people.length === 1 ? people[0].name : undefined}
            >
              <div className={`flex ${people.length > 1 ? '-space-x-2' : ''}`}>
                {people.slice(0, 4).map((p, i) => (
                  <div
                    key={p.id}
                    className="relative size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface shadow-sm"
                    style={{
                      backgroundColor: colorFromId(p.id),
                      zIndex: people.length - i,
                      marginLeft: people.length > 1 && i > 0 ? -8 : 0,
                    }}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                ))}
                {people.length > 4 && (
                  <div
                    className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-surface-3 text-text-dim border-2 border-surface shrink-0"
                    style={{ marginLeft: -8 }}
                  >
                    +{people.length - 4}
                  </div>
                )}
              </div>
              {/* 호버 시 담당자 리스트 툴팁 (2명 이상) */}
              {people.length > 1 && (
                <div className="absolute right-0 top-full mt-1 py-1.5 px-2 rounded-lg bg-surface-2 border border-line shadow-lg text-[11px] text-text opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto z-50 min-w-[120px] transition-opacity">
                  {people.map((p) => (
                    <div key={p.id} className="py-0.5 truncate">
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
