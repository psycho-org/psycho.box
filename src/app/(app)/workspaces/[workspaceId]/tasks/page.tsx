'use client';

import { use, useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { CardList, TaskStatusDot } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import type { TaskStatus } from '@/lib/task-status';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: { id: string; name: string; email: string } | null;
}

export default function TasksPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    apiRequest<Task[]>(`/api/real/workspaces/${workspaceId}/tasks?page=1&size=100`)
      .then((result) => {
        if (!result.ok) {
          setError(result.message ?? '태스크를 불러오지 못했습니다.');
          return;
        }
        const list = Array.isArray(result.data) ? result.data : [];
        setTasks(list);
      })
      .catch(() => setError('태스크를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="태스크"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">모든 태스크</h3>
        {loading ? (
          <p className="text-text-soft text-[13px] mb-3">태스크 로딩 중...</p>
        ) : error ? (
          <p className="text-red text-[13px] mb-3">{error}</p>
        ) : null}
        <div className="flex gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            전체
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            내 태스크
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            백로그
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            로드맵
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            완료됨
          </span>
        </div>
        {!loading && !error && (
          <CardList
            items={tasks}
            getItemId={(t) => t.id}
            columns={3}
            emptyMessage="태스크가 없습니다."
            renderCard={(task) => (
              <div className="flex items-start gap-2">
                <TaskStatusDot status={task.status} className="mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-medium text-[14px] truncate">{task.title}</p>
                  {task.dueDate && (
                    <p className="m-0 mt-0.5 text-xs text-text-dim">
                      {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </section>
    </AppShell>
  );
}
