'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePageTitle } from '@/components/page-title-context';
import { TaskStatusDot, CollapsibleTableList } from '@/components/ui';
import { TodoCard } from '@/components/todo-card';
import { TodoCardList } from '@/components/todo-card-list';
import { TaskCreateModal } from '@/components/task-create-modal';
import { TaskDetailModal, type TaskDetailModalTask } from '@/components/task-detail-modal';
import { TaskRoadmap } from '@/components/task-roadmap';
import { apiRequest } from '@/lib/client';
import { USER_ID_COOKIE } from '@/lib/constants';
import { getErrorMessage } from '@/lib/error-messages';
import type { TaskStatus } from '@/lib/task-status';
import { TASK_STATUS_COLORS } from '@/lib/task-status';

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
  sprintId?: string | null;
  sprintEndDate?: string | null;
}

/** 마감일 지남(주황) / 스프린트 종료(빨강) 여부 */
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

/** 기한 지남 표시: 은은한 배경 + 날짜 색상 */
const ALERT_BG = {
  overdue: 'bg-[rgba(232,165,74,0.06)]',
  'sprint-ended': 'bg-[rgba(217,107,107,0.06)]',
} as const;
const ALERT_DATE_COLOR = {
  overdue: 'text-[#e8a54a]',
  'sprint-ended': 'text-[#d96b6b]',
} as const;

const COLUMNS: { label: string; status: TaskStatus }[] = [
  { label: '할일', status: 'TODO' },
  { label: '진행중', status: 'IN_PROGRESS' },
  { label: '검토중', status: 'CANCELLED' },
  { label: '완료', status: 'DONE' },
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

/** ID 기반 고정 색상 (같은 ID면 항상 같은 색) */
function colorFromId(id: string): string {
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 55%, 45%)`;
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
  const bgColor = assignee ? colorFromId(assignee.id) : 'var(--color-surface-3)';
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetailModalTask | null>(null);
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view') as BoardView | null;
  const view: BoardView = viewParam && ['sprint', 'assignee', 'my', 'roadmap'].includes(viewParam)
    ? viewParam
    : 'sprint';
  const displayParam = searchParams.get('display');
  const display = displayParam === 'list' ? 'list' : displayParam === 'card' ? 'card' : 'kanban';
  const [assigneesExpanded, setAssigneesExpanded] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState<AssigneeFilterKey | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sprintEndDate, setSprintEndDate] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    apiRequest<{ sprintId?: string; endDate?: string }[]>(
      `/api/real/workspaces/${workspaceId}/sprints`,
    )
      .then((result) => {
        const raw = result.data;
        const list = Array.isArray(raw) ? raw : [];
        const withEndDate = list.filter((s) => s?.endDate);
        const sorted = withEndDate.sort(
          (a, b) => new Date(b!.endDate!).getTime() - new Date(a!.endDate!).getTime(),
        );
        setSprintEndDate(sorted[0]?.endDate ?? null);
      })
      .catch(() => setSprintEndDate(null));
  }, [workspaceId]);

  /** 담당자별 목록 (id, name, count) + 담당자 없음. id별로 다른 색을 위해 유효한 id가 있으면 그대로, 없으면 taskId 기반 고유 키 사용 */
  const assigneeList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    let noAssigneeCount = 0;
    for (const t of tasks) {
      if (t.assignee) {
        const effectiveId = t.assignee.id?.trim() || `task-${t.id}`;
        const cur = map.get(effectiveId);
        if (cur) {
          cur.count += 1;
        } else {
          map.set(effectiveId, {
            id: effectiveId,
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
    return tasks.filter((t) => {
      if (!t.assignee) return false;
      const effectiveId = t.assignee.id?.trim() || `task-${t.id}`;
      return effectiveId === selectedAssignee;
    });
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

  function openDetailModal(task: TaskDetailModalTask) {
    setSelectedTask(task);
    setDetailModalOpen(true);
  }

  function toTodoCardTask(task: Task) {
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

  function handleTaskDragStart(event: React.DragEvent<HTMLDivElement>, taskId: string) {
    setDraggingTaskId(taskId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    event.currentTarget.classList.add('opacity-60');
  }

  function handleTaskDragEnd(event: React.DragEvent<HTMLDivElement>) {
    event.currentTarget.classList.remove('opacity-60');
    setDraggingTaskId(null);
    setDragOverStatus(null);
  }

  function handleColumnDragOver(event: React.DragEvent<HTMLDivElement>, status: TaskStatus) {
    if (!draggingTaskId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverStatus(status);
  }

  async function moveTaskStatus(taskId: string, targetStatus: TaskStatus) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current || current.status === targetStatus) return;

    const previousStatus = current.status;
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status: targetStatus } : task)),
    );
    setError(null);

    const result = await apiRequest(
      `/api/real/workspaces/${workspaceId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      },
    );

    if (!result.ok) {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: previousStatus } : task)),
      );
      setError(
        getErrorMessage({
          code: result.code,
          message: result.message,
          status: result.status,
        }),
      );
      return;
    }

    setError(null);
  }

  async function moveTaskDueDate(taskId: string, dueDate: string) {
    const current = tasks.find((task) => task.id === taskId);
    if (!current) return;

    const previousDueDate = current.dueDate ?? null;
    const previousDueDateKey = previousDueDate ? previousDueDate.slice(0, 10) : null;
    if (previousDueDateKey === dueDate) return;

    const nextDueDate = `${dueDate}T23:59:59.000Z`;
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, dueDate: nextDueDate } : task)),
    );
    setError(null);

    const result = await apiRequest(
      `/api/real/workspaces/${workspaceId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ dueDate: nextDueDate }),
      },
    );

    if (!result.ok) {
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, dueDate: previousDueDate } : task)),
      );
      setError(
        getErrorMessage({
          code: result.code,
          message: result.message,
          status: result.status,
        }),
      );
    }
  }

  async function handleColumnDrop(event: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) {
    event.preventDefault();
    const taskIdFromData = event.dataTransfer.getData('text/plain');
    const taskId = draggingTaskId ?? taskIdFromData;

    setDraggingTaskId(null);
    setDragOverStatus(null);

    if (!taskId) return;
    await moveTaskStatus(taskId, targetStatus);
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

  const viewTitles: Record<BoardView, string> = {
    sprint: '스프린트',
    assignee: '담당자',
    my: '나의 테스크',
    roadmap: '로드맵',
  };

  /** 리스트 뷰용 그룹 데이터 (대분류별 접기) */
  const listGroups = useMemo(() => {
    const source = view === 'my' ? myTasks : tasks;

    if (view === 'assignee') {
      // 담당자별 그룹 (접기 헤더로 담당자 목록 표시, ID 기반 색상으로 구분)
      const groups: { key: string; label: string; count: number; items: Task[]; accentColor?: string }[] = [];
      for (const a of assigneeList.list) {
        const items = source.filter((t) => {
          if (!t.assignee) return false;
          const effectiveId = t.assignee.id?.trim() || `task-${t.id}`;
          return effectiveId === a.id;
        });
        groups.push({
          key: a.id,
          label: a.name,
          count: items.length,
          items,
          accentColor: colorFromId(a.id),
        });
      }
      if (assigneeList.noAssigneeCount > 0) {
        const items = source.filter((t) => !t.assignee);
        groups.push({ key: 'none', label: '담당자 없음', count: items.length, items });
      }
      return groups;
    }

    if (view === 'roadmap') {
      // 로드맵: 마감일 월별 그룹
      const byMonth = new Map<string, Task[]>();
      for (const t of source) {
        const month = t.dueDate
          ? `${new Date(t.dueDate).getFullYear()}-${String(new Date(t.dueDate).getMonth() + 1).padStart(2, '0')}`
          : 'no-date';
        const list = byMonth.get(month) ?? [];
        list.push(t);
        byMonth.set(month, list);
      }
      const months = Array.from(byMonth.keys()).sort((a, b) => {
        if (a === 'no-date') return 1;
        if (b === 'no-date') return -1;
        return a.localeCompare(b);
      });
      return months.map((month) => {
        const items = (byMonth.get(month) ?? []).sort((a, b) => {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return aDate - bDate;
        });
        const label = month === 'no-date' ? '마감일 없음' : `${month.slice(0, 4)}년 ${parseInt(month.slice(5), 10)}월`;
        return { key: month, label, count: items.length, items };
      });
    }

    // 스프린트, 나의 테스크: 상태별 그룹
    return COLUMNS.map(({ label, status }) => ({
      key: status,
      label,
      count: source.filter((t) => t.status === status).length,
      items: source.filter((t) => t.status === status).sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aDate - bDate;
      }),
      accentColor: TASK_STATUS_COLORS[status],
    }));
  }, [view, tasks, myTasks, assigneeList]);

  const assigneeCount = assigneeList.list.length + (assigneeList.noAssigneeCount > 0 ? 1 : 0);
  const pageTitle =
    view === 'assignee' ? `${viewTitles[view]} (${assigneeCount})` : viewTitles[view];

  const pageTitleCtx = usePageTitle();
  useEffect(() => {
    pageTitleCtx?.setTitle(pageTitle);
  }, [pageTitle, pageTitleCtx]);

  return (
    <>
    <section className="bg-surface border border-line/40 rounded-2xl p-5 shadow-sm">
        {loading ? (
          <p className="text-text-soft text-[13px]">태스크 로딩 중...</p>
        ) : error ? (
          <p className="text-red text-[13px]">{error}</p>
        ) : display === 'card' && view !== 'roadmap' ? (
          <TodoCardList
            tasks={(view === 'my' ? myTasks : view === 'assignee' ? filteredTasks : tasks).map((t) =>
              toTodoCardTask(t),
            )}
            sprintEndDate={sprintEndDate}
            columns={3}
            emptyMessage="태스크가 없습니다."
            onCardClick={(task) => openDetailModal(task as TaskDetailModalTask)}
          />
        ) : display === 'list' ? (
          <CollapsibleTableList<Task>
            groups={listGroups}
            getItemId={(t) => t.id}
            onRowClick={(task) => openDetailModal(toTodoCardTask(task))}
            getItemRowClassName={(task) => {
              const alertType = getTaskAlertType(task, sprintEndDate);
              return alertType ? ALERT_BG[alertType] : '';
            }}
            emptyMessage="태스크가 없습니다."
            defaultExpanded={true}
            columns={[
              {
                key: 'title',
                label: '제목',
                render: (task) => {
                  const { displayTitle } = parseTagsFromTitle(task.title);
                  return <span className="truncate block">{displayTitle}</span>;
                },
              },
              {
                key: 'status',
                label: '상태',
                width: '100px',
                render: (task) => (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <TaskStatusDot status={task.status} className="size-2.5 shrink-0" />
                    {COLUMNS.find((c) => c.status === task.status)?.label ?? task.status}
                  </span>
                ),
              },
              {
                key: 'assignee',
                label: '담당자',
                width: '100px',
                render: (task) => {
                  const name = task.assignee?.name ?? task.assignee?.email ?? '-';
                  return <span className="truncate block">{name}</span>;
                },
              },
              {
                key: 'dueDate',
                label: '마감일',
                width: '100px',
                render: (task) => {
                  const alertType = getTaskAlertType(task, sprintEndDate);
                  const dateCls = alertType ? ALERT_DATE_COLOR[alertType] : 'text-text-dim';
                  return (
                    <span className={`whitespace-nowrap ${dateCls}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ko-KR') : '-'}
                    </span>
                  );
                },
              },
            ]}
          />
        ) : view === 'roadmap' ? (
          <div className="min-w-0">
            <TaskRoadmap
              tasks={roadmapTasks}
              monthCount={2}
              sprintEndDate={sprintEndDate}
              onTaskDueDateChange={moveTaskDueDate}
              onTaskClick={(task) => openDetailModal(toTodoCardTask(task as Task))}
            />
          </div>
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
                    <span className="tabular-nums text-text-dim">({assigneeCount})</span>
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
                {COLUMNS.map(({ label, status }) => {
                  const items = tasksByStatus(status);
                  return (
                    <div
                      key={status}
                      className="flex flex-col min-w-0 rounded-2xl bg-surface border border-line/40 overflow-hidden"
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
                      <div
                        className={`flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[120px] transition-colors ${
                          dragOverStatus === status ? 'bg-accent-dim/30' : ''
                        }`}
                        onDragOver={(event) => handleColumnDragOver(event, status)}
                        onDrop={(event) => {
                          void handleColumnDrop(event, status);
                        }}
                      >
                        {items.map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(event) => handleTaskDragStart(event, task.id)}
                            onDragEnd={handleTaskDragEnd}
                            className={`cursor-grab active:cursor-grabbing ${
                              draggingTaskId === task.id ? 'opacity-60' : ''
                            }`}
                          >
                            <div 
                              role="button" 
                              tabIndex={0} 
                              className="cursor-pointer rounded-xl transition-all duration-200 hover:bg-surface-2/60 hover:scale-[1.01] hover:shadow-sm"
                              onClick={() => openDetailModal(toTodoCardTask(task))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  openDetailModal(toTodoCardTask(task));
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
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-1">
            {COLUMNS.map(({ label, status }) => {
              const items = tasksByStatus(status);
              return (
                <div
                  key={status}
                  className="flex flex-col min-w-0 rounded-2xl bg-surface border border-line/40 overflow-hidden"
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
                  <div
                    className={`flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[120px] transition-colors ${
                      dragOverStatus === status ? 'bg-accent-dim/30' : ''
                    }`}
                    onDragOver={(event) => handleColumnDragOver(event, status)}
                    onDrop={(event) => {
                      void handleColumnDrop(event, status);
                    }}
                  >
                    {items.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(event) => handleTaskDragStart(event, task.id)}
                        onDragEnd={handleTaskDragEnd}
                        className={`cursor-grab active:cursor-grabbing ${
                          draggingTaskId === task.id ? 'opacity-60' : ''
                        }`}
                      >
                            <div 
                              role="button" 
                              tabIndex={0} 
                              className="cursor-pointer rounded-xl transition-all duration-200 hover:bg-surface-2/60 hover:scale-[1.01] hover:shadow-sm"
                              onClick={() => openDetailModal(toTodoCardTask(task))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  openDetailModal(toTodoCardTask(task));
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
      <TaskDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        task={selectedTask}
      />
    </>
  );
}
