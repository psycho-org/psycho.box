'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TaskStatusDot } from '@/components/ui';
import { TaskCreateModal } from '@/components/task-create-modal';
import { TaskRoadmap } from '@/components/task-roadmap';
import { apiRequest } from '@/lib/client';
import { USER_ID_COOKIE } from '@/lib/constants';
import type { TaskStatus } from '@/lib/task-status';

type BoardView = 'sprint' | 'assignee' | 'my' | 'roadmap';

function getCurrentUserId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`${USER_ID_COOKIE}=([^;]+)`));
  return match?.[1]?.trim() ?? null;
}

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

function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${expanded ? 'rotate-90' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function AssigneeAvatar({
  assignee,
  className,
}: {
  assignee?: { id: string; name: string } | null;
  className?: string;
}) {
  const initials = assignee?.name
    ? assignee.name.slice(0, 2).toUpperCase()
    : '?';
  const hue = assignee ? (assignee.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360) : 0;
  const bgColor = assignee ? `hsl(${hue}, 55%, 45%)` : 'var(--color-surface-3)';
  return (
    <div
      className={`shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-surface shadow-sm ${assignee ? 'text-white' : 'text-text-dim'} ${className ?? 'size-8'}`}
      style={{ backgroundColor: bgColor }}
      title={assignee?.name ?? '담당자 없음'}
    >
      {initials}
    </div>
  );
}

/** 담당자별 그룹 키: assignee.id 또는 'none' (담당자 없음) */
type AssigneeFilterKey = string | 'none';

export default function BoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('TODO');
  const [view, setView] = useState<BoardView>('sprint');
  const [assigneesExpanded, setAssigneesExpanded] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState<AssigneeFilterKey | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  /** 담당자별 목록 (id, name, count) + 담당자 없음 */
  const assigneeList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    let noAssigneeCount = 0;
    for (const t of tasks) {
      if (t.assignee) {
        const cur = map.get(t.assignee.id);
        if (cur) {
          cur.count += 1;
        } else {
          map.set(t.assignee.id, {
            id: t.assignee.id,
            name: t.assignee.name || t.assignee.email || '알 수 없음',
            count: 1,
          });
        }
      } else {
        noAssigneeCount += 1;
      }
    }
    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    return { list, noAssigneeCount };
  }, [tasks]);

  /** 선택된 담당자 기준 필터링된 태스크 */
  const filteredTasks = useMemo(() => {
    if (!selectedAssignee) return tasks;
    if (selectedAssignee === 'none') {
      return tasks.filter((t) => !t.assignee);
    }
    return tasks.filter((t) => t.assignee?.id === selectedAssignee);
  }, [tasks, selectedAssignee]);

  /** 내 태스크 (assignee가 현재 사용자인 것) */
  const myTasks = useMemo(() => {
    if (!currentUserId) return [];
    return tasks.filter((t) => t.assignee?.id === currentUserId);
  }, [tasks, currentUserId]);

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

  const tasksByStatus = (status: TaskStatus) => {
    const source = view === 'my' ? myTasks : view === 'assignee' ? filteredTasks : tasks;
    return source.filter((t) => t.status === status);
  };

  /** 로드맵에 표시할 태스크 */
  const roadmapTasks = useMemo(() => {
    const source = view === 'my' ? myTasks : view === 'assignee' ? filteredTasks : tasks;
    return source;
  }, [view, tasks, myTasks, filteredTasks]);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="스프린트 보드"
    >
      <section className="bg-surface border border-line rounded-2xl p-4">
        {/* 보드 뷰 전환 탭 */}
        <nav className="flex items-center gap-1 mb-4" aria-label="보드 뷰 전환">
          <button
            type="button"
            onClick={() => setView('sprint')}
            className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors ${
              view === 'sprint'
                ? 'bg-accent-dim text-accent-soft underline underline-offset-2'
                : 'text-text-soft hover:text-text hover:bg-surface-2'
            }`}
          >
            Task
          </button>
          <button
            type="button"
            onClick={() => setView('assignee')}
            className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors ${
              view === 'assignee'
                ? 'bg-accent-dim text-accent-soft underline underline-offset-2'
                : 'text-text-soft hover:text-text hover:bg-surface-2'
            }`}
          >
            Assignee
          </button>
          <button
            type="button"
            onClick={() => setView('my')}
            className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors ${
              view === 'my'
                ? 'bg-accent-dim text-accent-soft underline underline-offset-2'
                : 'text-text-soft hover:text-text hover:bg-surface-2'
            }`}
          >
            My items
          </button>
          <button
            type="button"
            onClick={() => setView('roadmap')}
            className={`px-2.5 py-1 rounded-lg text-[13px] font-medium transition-colors ${
              view === 'roadmap'
                ? 'bg-accent-dim text-accent-soft underline underline-offset-2'
                : 'text-text-soft hover:text-text hover:bg-surface-2'
            }`}
          >
            Roadmap
          </button>
        </nav>
        {loading ? (
          <p className="text-text-soft text-[13px]">태스크 로딩 중...</p>
        ) : error ? (
          <p className="text-red text-[13px]">{error}</p>
        ) : view === 'roadmap' ? (
          <TaskRoadmap tasks={roadmapTasks} monthCount={2} />
        ) : view === 'assignee' ? (
          <div className="flex gap-4">
            {/* 담당자 사이드바 */}
            <aside className="w-52 shrink-0">
              <button
                type="button"
                onClick={() => setAssigneesExpanded((e) => !e)}
                className="w-full flex items-center gap-2 py-2 text-left text-[14px] font-semibold text-text"
              >
                <ChevronIcon className="size-4 text-text-dim" expanded={assigneesExpanded} />
                담당자
              </button>
              {assigneesExpanded && (
                <div className="mt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignee(null)}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] transition-colors ${
                      selectedAssignee === null
                        ? 'bg-accent-dim text-accent-soft'
                        : 'hover:bg-surface-2 text-text'
                    }`}
                  >
                    <span className="text-text-dim tabular-nums shrink-0">전체</span>
                    <span className="tabular-nums text-text-dim">({tasks.length})</span>
                  </button>
                  {assigneeList.list.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAssignee(a.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] transition-colors ${
                        selectedAssignee === a.id
                          ? 'bg-accent-dim text-accent-soft'
                          : 'hover:bg-surface-2 text-text'
                      }`}
                    >
                      <AssigneeAvatar
                        assignee={{ id: a.id, name: a.name }}
                        className="size-6"
                      />
                      <span className="min-w-0 truncate flex-1">{a.name}</span>
                      <span className="tabular-nums text-text-dim shrink-0">{a.count}</span>
                    </button>
                  ))}
                  {assigneeList.noAssigneeCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedAssignee('none')}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] transition-colors ${
                        selectedAssignee === 'none'
                          ? 'bg-accent-dim text-accent-soft'
                          : 'hover:bg-surface-2 text-text'
                      }`}
                    >
                      <AssigneeAvatar assignee={null} className="size-6" />
                      <span className="min-w-0 truncate flex-1">담당자 없음</span>
                      <span className="tabular-nums text-text-dim shrink-0">
                        {assigneeList.noAssigneeCount}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </aside>
            {/* 담당자별 태스크 보드 */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-1">
                {COLUMNS.map(({ label, status, description }) => {
                  const items = tasksByStatus(status);
                  return (
                    <div
                      key={status}
                      className="flex flex-col min-w-0 rounded-xl bg-surface-2 border border-line overflow-hidden"
                    >
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
                        <button
                          type="button"
                          onClick={() => openCreateModal(status)}
                          className="p-1.5 rounded-lg hover:bg-accent-dim text-text-dim hover:text-accent-soft shrink-0"
                          aria-label="태스크 추가"
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
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
            </div>
          </div>
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
