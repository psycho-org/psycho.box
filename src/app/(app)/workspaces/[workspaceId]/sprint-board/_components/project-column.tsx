'use client';

import { Select, TaskStatusDot } from '@/components/ui';
import type { TaskStatus } from '@/lib/task-status';

interface Project {
  projectId: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee?: { id: string; name: string; email: string } | null;
  dueDate?: string | null;
}

interface DragState {
  taskId: string;
  fromProjectId: string;
}

interface ProjectMetrics {
  totalCount: number;
  completedCount: number;
  progress: number;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function ChevronIcon({ className, collapsed }: { className?: string; collapsed: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${collapsed ? '-rotate-90' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR');
}

interface ProjectColumnProps {
  project: Project;
  tasks: Task[];
  projects: Project[];
  metrics: ProjectMetrics;
  isDropTarget: boolean;
  isCollapsed: boolean;
  dragState: DragState | null;
  movingTaskId: string | null;
  deletingTaskId: string | null;
  deletingProjectId: string | null;
  onToggleCollapsed: (projectId: string) => void;
  onCreateTask: (projectId: string) => void;
  onDeleteProject: (projectId: string, name: string, taskCount: number) => void;
  onDragOver: (event: React.DragEvent<HTMLElement>, projectId: string) => void;
  onDragLeave: (event: React.DragEvent<HTMLElement>, projectId: string) => void;
  onDrop: (event: React.DragEvent<HTMLElement>, projectId: string) => void;
  onTaskDragStart: (event: React.DragEvent<HTMLElement>, taskId: string, fromProjectId: string) => void;
  onTaskDragEnd: () => void;
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, fromProjectId: string, toProjectId: string) => void;
  onDeleteTask: (taskId: string, title: string) => void;
}

export function ProjectColumn({
  project,
  tasks,
  projects,
  metrics,
  isDropTarget,
  isCollapsed,
  dragState,
  movingTaskId,
  deletingTaskId,
  deletingProjectId,
  onToggleCollapsed,
  onCreateTask,
  onDeleteProject,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskDragStart,
  onTaskDragEnd,
  onTaskClick,
  onMoveTask,
  onDeleteTask,
}: ProjectColumnProps) {
  return (
    <section
      className={`rounded-2xl border bg-surface shadow-sm transition-all ${
        isDropTarget
          ? 'border-accent shadow-[0_0_0_2px_rgba(222,133,83,0.25)] bg-accent-dim/20 scale-[1.003]'
          : 'border-line/40'
      }`}
      onDragOver={(event) => onDragOver(event, project.projectId)}
      onDragLeave={(event) => onDragLeave(event, project.projectId)}
      onDrop={(event) => onDrop(event, project.projectId)}
    >
      <div className="sticky top-0 z-10 rounded-t-2xl border-b border-line/40 bg-surface/95 backdrop-blur px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleCollapsed(project.projectId)}
              className="inline-flex shrink-0 items-center justify-center rounded-lg p-1 text-text-dim transition-colors hover:text-text"
              aria-label={isCollapsed ? '프로젝트 펼치기' : '프로젝트 접기'}
              title={isCollapsed ? '프로젝트 펼치기' : '프로젝트 접기'}
            >
              <ChevronIcon className="size-4" collapsed={isCollapsed} />
            </button>
            <div className="min-w-0">
              <h3 className="m-0 text-[16px] font-semibold text-text truncate">{project.name}</h3>
              <p className="m-0 mt-1 text-[12px] text-text-dim">
                {tasks.length === 0
                  ? '비어 있는 프로젝트입니다. 태스크를 드롭해 시작할 수 있습니다.'
                  : `${tasks.length}개의 태스크가 이 프로젝트에 연결되어 있습니다.`}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-3 shrink-0 lg:w-auto lg:flex-nowrap lg:justify-end">
            <span className="text-[12px] text-text-dim tabular-nums">
              {metrics.completedCount} / {metrics.totalCount}
            </span>
            <div className="flex-1 lg:w-24 lg:flex-none h-2 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${metrics.progress}%` }}
              />
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onCreateTask(project.projectId)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-[12px] font-medium text-text transition-colors hover:bg-blue/15 hover:text-blue"
              >
                <PlusIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteProject(project.projectId, project.name, tasks.length)}
                disabled={deletingProjectId === project.projectId}
                className="inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface/70 hover:text-red disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="프로젝트 삭제"
                title="프로젝트 삭제"
              >
                <TrashIcon className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isCollapsed ? null : (
        <div className="p-4">
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line/60 bg-surface-2/30 px-4 py-8 text-center text-[13px] text-text-dim">
              {dragState ? '여기에 드롭해서 이 프로젝트로 이동' : '연결된 태스크가 없습니다.'}
            </div>
          ) : (
            <div className="grid gap-3">
              {tasks.map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={(event) => onTaskDragStart(event, task.id, project.projectId)}
                  onDragEnd={onTaskDragEnd}
                  onClick={() => onTaskClick(task)}
                  className={`rounded-2xl border px-4 py-3 transition-all ${
                    movingTaskId === task.id
                      ? 'opacity-60 border-line/50 bg-surface-2/40'
                      : dragState?.taskId === task.id
                        ? 'opacity-35 rotate-[0.6deg] scale-[0.985] border-accent/70 bg-accent-dim/20 shadow-[0_10px_24px_rgba(0,0,0,0.22)]'
                        : 'border-line/50 bg-surface-2/40 hover:shadow-sm hover:border-line/80'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TaskStatusDot status={task.status} className="size-2.5 shrink-0" />
                        <h4 className="m-0 text-[14px] font-medium text-text break-all">
                          {task.title}
                        </h4>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-dim">
                        <span>{task.assignee?.name || task.assignee?.email || '담당자 없음'}</span>
                        <span>마감일 {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-2 shrink-0 sm:w-auto sm:flex-nowrap sm:justify-end">
                      <Select
                        size="sm"
                        className="min-w-0 flex-1 sm:max-w-[180px] sm:flex-none"
                        value={project.projectId}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(toProjectId) => {
                          if (toProjectId !== project.projectId) {
                            onMoveTask(task.id, project.projectId, toProjectId);
                          }
                        }}
                        options={projects.map((p) => ({ value: p.projectId, label: p.name }))}
                      />
                      <button
                        type="button"
                        aria-label="태스크 삭제"
                        title="태스크 삭제"
                        disabled={deletingTaskId === task.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteTask(task.id, task.title);
                        }}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface/70 hover:text-red disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
