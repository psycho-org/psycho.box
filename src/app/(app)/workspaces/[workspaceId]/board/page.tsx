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

const COLUMNS: { label: string; status: TaskStatus; description: string }[] = [
  { label: '할일', status: 'TODO', description: '시작 전 대기 중' },
  { label: '진행중', status: 'IN_PROGRESS', description: '현재 진행 중' },
  { label: '검토중', status: 'CANCELLED', description: '검토 대기 중' },
  { label: '완료', status: 'DONE', description: '완료됨' },
];

/** 제목에서 [TAG] 패턴 추출 */
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

const TAG_COLORS: Record<string, string> = {
  FEAT: 'bg-blue/20 text-blue border-blue/30',
  FIX: 'bg-red/20 text-red border-red/30',
  REFACTOR: 'bg-purple/20 text-purple border-purple/30',
  DOCS: 'bg-green/20 text-green border-green/30',
  TEST: 'bg-orange/20 text-orange border-orange/30',
  DEFAULT: 'bg-surface-3 text-text-soft border-line',
};

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

function AssigneeAvatar({ assignee }: { assignee?: { id: string; name: string } | null }) {
  const initials = assignee?.name
    ? assignee.name.slice(0, 2).toUpperCase()
    : '?';
  const hue = assignee ? (assignee.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360) : 0;
  const bgColor = assignee ? `hsl(${hue}, 55%, 45%)` : 'var(--color-surface-3)';
  return (
    <div
      className={`size-8 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-surface shadow-sm ${assignee ? 'text-white' : 'text-text-dim'}`}
      style={{ backgroundColor: bgColor }}
      title={assignee?.name ?? '담당자 없음'}
    >
      {initials}
    </div>
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
      <section className="bg-surface border border-line rounded-2xl p-4">
        {loading ? (
          <p className="text-text-soft text-[13px]">태스크 로딩 중...</p>
        ) : error ? (
          <p className="text-red text-[13px]">{error}</p>
        ) : (
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-1">
            {COLUMNS.map(({ label, status, description }) => {
              const items = tasksByStatus(status);
              return (
                <div
                  key={status}
                  className="flex flex-col min-w-0 rounded-xl bg-surface-2 border border-line overflow-hidden"
                >
                  {/* 컬럼 헤더 */}
                  <div className="flex items-start justify-between gap-2 p-4 border-b border-line">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TaskStatusDot status={status} className="size-2.5" />
                        <h4 className="m-0 text-[14px] font-semibold text-text truncate flex items-center gap-1.5">
                          {label}
                          <span className="text-[12px] font-normal text-text-dim tabular-nums">
                            {items.length}
                          </span>
                        </h4>
                      </div>
                      <p className="m-0 text-[11px] text-text-dim">{description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim"
                        aria-label="더보기"
                      >
                        <MoreIcon className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openCreateModal(status)}
                        className="p-1.5 rounded-lg hover:bg-accent-dim text-text-dim hover:text-accent-soft"
                        aria-label="태스크 추가"
                      >
                        <PlusIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                  {/* 카드 목록 */}
                  <div className="flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[120px]">
                    {items.map((task) => {
                      const { tags, displayTitle } = parseTagsFromTitle(task.title);
                      return (
                        <div
                          key={task.id}
                          className="group rounded-xl border border-line bg-surface p-3 hover:border-line-2 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <TaskStatusDot status={task.status} className="size-2 shrink-0 mt-0.5" />
                              <p className="m-0 text-[13px] font-medium text-text line-clamp-2 flex-1">
                                {displayTitle}
                              </p>
                            </div>
                            <AssigneeAvatar assignee={task.assignee} />
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${TAG_COLORS[t.toUpperCase()] ?? TAG_COLORS.DEFAULT}`}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          {task.dueDate && (
                            <p className="m-0 mt-2 text-[11px] text-text-dim">
                              {new Date(task.dueDate).toLocaleDateString('ko-KR')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
