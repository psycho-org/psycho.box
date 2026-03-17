'use client';

import { TaskStatusDot } from '@/components/ui';
import { TodoCard, type TodoCardTask } from '@/components/todo-card';
import type { TaskStatus } from '@/lib/task-status';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function MoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  sprintId?: string | null;
  sprintStartDate?: string | null;
  sprintEndDate?: string | null;
}

interface KanbanColumnProps {
  label: string;
  status: TaskStatus;
  tasks: Task[];
  sprintEndDate: string | null;
  draggingTaskId: string | null;
  dragOverStatus: TaskStatus | null;
  showMoreButton?: boolean;
  onCreateTask: (status: TaskStatus) => void;
  onTaskClick: (task: TodoCardTask) => void;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>, status: TaskStatus) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>, status: TaskStatus) => Promise<void>;
}

function toTodoCardTask(task: Task): TodoCardTask {
  return {
    id: task.id,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          name: task.assignee.name ?? task.assignee.email ?? '알 수 없음',
        }
      : null,
  };
}

export function KanbanColumn({
  label,
  status,
  tasks,
  sprintEndDate,
  draggingTaskId,
  dragOverStatus,
  showMoreButton = false,
  onCreateTask,
  onTaskClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-0 rounded-2xl bg-surface border border-line/40 overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b border-line p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <TaskStatusDot status={status} className="size-2.5" />
            <h4 className="m-0 text-[14px] font-semibold text-text truncate flex items-center gap-1.5">
              {label}
              <span className="text-[12px] font-normal text-text-dim tabular-nums">
                {tasks.length}
              </span>
            </h4>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {showMoreButton && (
            <button
              type="button"
              className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim"
              aria-label="더보기"
            >
              <MoreIcon className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onCreateTask(status)}
            className="p-1.5 rounded-lg hover:bg-accent-dim text-text-dim hover:text-accent-soft"
            aria-label="태스크 추가"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
      </div>
      <div
        className={`flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[120px] transition-colors ${
          dragOverStatus === status ? 'bg-accent-dim/30' : ''
        }`}
        onDragOver={(event) => onDragOver(event, status)}
        onDrop={(event) => { void onDrop(event, status); }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(event) => onDragStart(event, task.id)}
            onDragEnd={onDragEnd}
            className={`cursor-grab active:cursor-grabbing ${
              draggingTaskId === task.id ? 'opacity-60' : ''
            }`}
          >
            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-xl transition-all duration-200 hover:bg-surface-2/60 hover:scale-[1.01] hover:shadow-sm"
              onClick={() => onTaskClick(toTodoCardTask(task))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onTaskClick(toTodoCardTask(task));
                }
              }}
            >
              <TodoCard task={toTodoCardTask(task)} sprintEndDate={sprintEndDate} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
