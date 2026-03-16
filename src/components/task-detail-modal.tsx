'use client';

import { Dialog } from '@/components/ui/dialog';
import { Button, TaskStatusDot } from '@/components/ui';
import { TASK_STATUS_LABELS, type TaskStatus } from '@/lib/task-status';

interface TaskAssignee {
  id: string;
  name?: string;
  email?: string;
}

export interface TaskDetailModalTask {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: TaskAssignee | null;
  assignees?: TaskAssignee[];
}

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task: TaskDetailModalTask | null;
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

function colorFromId(id: string): string {
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function AssigneeAvatar({
  assignee,
  className,
}: {
  assignee?: TaskAssignee | null;
  className?: string;
}) {
  const name = assignee?.name ?? assignee?.email ?? '?';
  const initials = name.slice(0, 2).toUpperCase();
  const bgColor = assignee ? colorFromId(assignee.id) : 'var(--color-surface-3)';
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-surface shadow-sm ${assignee ? 'text-white' : 'text-text-dim'} ${className ?? 'size-8'}`}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {initials}
    </div>
  );
}

export function TaskDetailModal({ open, onClose, task }: TaskDetailModalProps) {
  if (!task) return null;

  const { displayTitle, tags } = parseTagsFromTitle(task.title);

  const people = task.assignees?.length
    ? task.assignees
    : task.assignee
      ? [task.assignee]
      : [];

  const dueDateLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '마감일 없음';

  const isDone = task.status === 'DONE' || task.status === 'CANCELLED';
  const isOverdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Dialog open={open} onClose={onClose} title="태스크 상세 정보">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-text mb-2 break-all">{displayTitle}</h2>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-surface-3 text-text-soft border border-line"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-text-soft">상태</span>
            <div className="flex items-center gap-2 mt-1">
              <TaskStatusDot status={task.status} />
              <span className="text-[14px] text-text font-medium">{TASK_STATUS_LABELS[task.status]}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-medium text-text-soft">마감일</span>
            <div className={`text-[14px] font-medium mt-1 ${isOverdue ? 'text-[#e8a54a]' : 'text-text'}`}>
              {dueDateLabel} {isOverdue && '(기한 지남)'}
            </div>
          </div>

          <div className="flex flex-col gap-1 col-span-2 mt-2">
            <span className="text-[12px] font-medium text-text-soft">담당자</span>
            {people.length > 0 ? (
              <div className="flex flex-wrap gap-3 mt-1.5">
                {people.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-line/50">
                    <AssigneeAvatar assignee={p} className="size-6" />
                    <span className="text-[13px] text-text">{p.name || p.email || '이름 없음'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[14px] text-text-dim mt-1">지정되지 않음</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-line">
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
