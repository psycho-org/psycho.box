'use client';

import { TASK_STATUS_COLORS, TASK_STATUS_IS_OUTLINE, type TaskStatus } from '@/lib/task-status';

export interface TaskStatusDotProps {
  status: TaskStatus;
  className?: string;
}

export function TaskStatusDot({ status, className = '' }: TaskStatusDotProps) {
  const color = TASK_STATUS_COLORS[status];
  const isOutline = TASK_STATUS_IS_OUTLINE[status];

  if (isOutline) {
    return (
      <span
        className={`inline-block shrink-0 size-2 rounded-full border border-dotted ${className}`}
        style={{
          backgroundColor: 'transparent',
          borderColor: color,
        }}
        title={status}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-block shrink-0 size-2 rounded-full ${className}`}
      style={{ backgroundColor: color }}
      title={status}
      aria-hidden
    />
  );
}
