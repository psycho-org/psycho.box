'use client';

import { use, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TaskStatusDot } from '@/components/ui';
import { TaskCreateModal } from '@/components/task-create-modal';
import { apiRequest } from '@/lib/client';
import type { TaskStatus } from '@/lib/task-status';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
}

const COLUMNS: { label: string; status: TaskStatus }[] = [
  { label: '할일', status: 'TODO' },
  { label: '진행중', status: 'IN_PROGRESS' },
  { label: '검토중', status: 'CANCELLED' },
  { label: '완료', status: 'DONE' },
];

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default function BoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('TODO');

  function openCreateModal(status: TaskStatus) {
    setCreateModalStatus(status);
    setCreateModalOpen(true);
  }

  function loadTasks() {
    if (!workspaceId) return;
    setLoading(true);
    apiRequest<Task[]>(`/api/real/workspaces/${workspaceId}/tasks?page=1&size=100`)
      .then((result) => {
        if (result.ok) {
          const list = Array.isArray(result.data) ? result.data : [];
          setTasks(list);
          setError(null);
        } else {
          setError(result.message ?? '태스크를 불러오지 못했습니다.');
        }
      })
      .catch(() => setError('태스크를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTasks();
  }, [workspaceId]);

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="스프린트 보드"
      subtitle="Kanban (할일/진행중/검토중/완료)"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">Kanban Board</h3>
        {loading ? (
          <p className="text-text-soft text-[13px]">태스크 로딩 중...</p>
        ) : error ? (
          <p className="text-red text-[13px]">{error}</p>
        ) : null}
        <div className="mt-4 grid grid-cols-4 gap-2.5 max-lg:grid-cols-1">
          {COLUMNS.map(({ label, status }) => (
            <div
              key={status}
              className="border border-line rounded-[10px] bg-surface-2 p-2.5 min-h-[180px]"
            >
              <h4 className="m-0 mb-2.5 text-xs uppercase tracking-[0.05em] text-text-soft">
                {label}
              </h4>
              <div className="space-y-2">
                {tasksByStatus(status).map((task) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-line bg-surface p-2.5 text-[13px] flex items-start gap-2"
                  >
                    <TaskStatusDot status={task.status} className="mt-1.5" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="m-0 font-medium truncate">{task.title}</p>
                      {task.assignee && (
                        <p className="m-0 text-xs text-text-dim truncate font-mono" title={task.assignee.id}>
                          담당자 ID: {task.assignee.id}
                        </p>
                      )}
                      {task.dueDate && (
                        <p className="m-0 text-xs text-text-dim">
                          업무 종료일: {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => openCreateModal(status)}
                className="mt-2 w-full rounded-lg border border-dashed border-line-2 bg-transparent p-3 flex items-center justify-center gap-2 text-text-dim hover:border-accent hover:text-accent-soft hover:bg-accent-dim/50 transition-colors"
              >
                <PlusIcon className="size-4" />
                <span className="text-[13px]">태스크 추가</span>
              </button>
            </div>
          ))}
        </div>
      </section>
      <TaskCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        workspaceId={workspaceId}
        defaultStatus={createModalStatus}
        onSuccess={loadTasks}
      />
    </AppShell>
  );
}
