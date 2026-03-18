'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePageTitle } from '@/components/page-title-context';
import { TaskStatusDot, CollapsibleTableList } from '@/components/ui';
import { TodoCardList } from '@/components/todo-card-list';
import { TaskCreateModal } from '@/components/task-create-modal';
import { TaskDetailModal, type TaskDetailModalTask } from '@/components/task-detail-modal';
import { TaskRoadmap } from '@/components/task-roadmap';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';
import { useAuth } from '@/components/auth-provider';
import type { TaskStatus } from '@/lib/task-status';
import { TASK_STATUS_COLORS } from '@/lib/task-status';
import {
  applyWorkspaceMemberDisplayNamesToTasks,
  fetchWorkspaceMembers,
  fetchWorkspaceMemberDisplayNameMap,
  type WorkspaceMemberDisplayNameMap,
  type WorkspaceMemberDisplaySource,
} from '@/lib/workspace-member-display';
import { KanbanColumn } from './_components/kanban-column';
import { AssigneeSidebar, colorFromId, type AssigneeFilterKey } from './_components/assignee-sidebar';

type BoardView = 'sprint' | 'assignee' | 'my' | 'roadmap';

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

interface SprintSummary {
  sprintId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
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


export default function BoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;
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
  const [selectedAssignee, setSelectedAssignee] = useState<AssigneeFilterKey | null>(null);

  const [sprintEndDate, setSprintEndDate] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberDisplaySource[]>([]);
  const [memberDisplayNameMap, setMemberDisplayNameMap] = useState<WorkspaceMemberDisplayNameMap>({});
  const [assigneePanelCollapsed, setAssigneePanelCollapsed] = useState(false);

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

  /** 현재 뷰에서 보이는 태스크 리스트 (네비게이션용) */
  const currentTaskList: Task[] = view === 'my'
    ? myTasks
    : view === 'assignee'
      ? filteredTasks
      : tasks;

  const selectedTaskIndex = selectedTask
    ? currentTaskList.findIndex((t) => t.id === selectedTask.id)
    : -1;

  function navigateTask(direction: 'prev' | 'next') {
    const idx = direction === 'prev' ? selectedTaskIndex - 1 : selectedTaskIndex + 1;
    if (idx < 0 || idx >= currentTaskList.length) return;
    const nextTask = currentTaskList[idx];
    openDetailModal(toTodoCardTask(nextTask));
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

  const loadTasks = useCallback(() => {
    if (!workspaceId) return;
    setLoading(true);
    Promise.all([
      apiRequest<Task[]>(`/api/real/workspaces/${workspaceId}/tasks?page=1&size=100`),
      apiRequest<SprintSummary[]>(`/api/real/workspaces/${workspaceId}/sprints`),
      fetchWorkspaceMembers(workspaceId),
    ])
      .then(([result, sprintResult, members]) => {
        const nextMemberDisplayNameMap = Object.fromEntries(
          members
            .map((member) => [member.accountId?.trim(), member.name?.trim()] as const)
            .filter(([accountId, name]) => accountId && name),
        ) as WorkspaceMemberDisplayNameMap;
        setWorkspaceMembers(members);
        setMemberDisplayNameMap(nextMemberDisplayNameMap);

        const rawSprints = sprintResult.data;
        const sprintList = Array.isArray(rawSprints) ? rawSprints : [];
        const sprintRangeById = Object.fromEntries(
          sprintList
            .filter((sprint) => sprint?.sprintId)
            .map((sprint) => [
              sprint.sprintId!,
              {
                startDate: sprint.startDate ?? null,
                endDate: sprint.endDate ?? null,
              },
            ]),
        ) as Record<string, { startDate: string | null; endDate: string | null }>;
        const withEndDate = sprintList.filter((sprint) => sprint?.endDate);
        const sorted = withEndDate.sort(
          (a, b) => new Date(b!.endDate!).getTime() - new Date(a!.endDate!).getTime(),
        );
        setSprintEndDate(sorted[0]?.endDate ?? null);

        if (result.ok) {
          const list = Array.isArray(result.data) ? result.data : [];
          const tasksWithSprintRanges = list.map((task) => {
            const sprintRange = task.sprintId ? sprintRangeById[task.sprintId] : undefined;
            return {
              ...task,
              sprintStartDate: sprintRange?.startDate ?? null,
              sprintEndDate: sprintRange?.endDate ?? task.sprintEndDate ?? null,
            };
          });
          setTasks(applyWorkspaceMemberDisplayNamesToTasks(tasksWithSprintRanges, nextMemberDisplayNameMap));
          setError(null);
        } else {
          setError(result.message ?? '태스크를 불러오지 못했습니다.');
        }
      })
      .catch(() => setError('태스크를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  const showAssigneeSidebar = view === 'assignee' && !loading && !error && display !== 'card' && display !== 'list';

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
          <div className="relative flex flex-col gap-4 lg:flex-row">
            <AssigneeSidebar
              assigneeList={assigneeList.list}
              noAssigneeCount={assigneeList.noAssigneeCount}
              selectedAssignee={selectedAssignee}
              collapsed={assigneePanelCollapsed}
              onSelect={setSelectedAssignee}
              onCollapsedChange={setAssigneePanelCollapsed}
            />
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-1">
                {COLUMNS.map(({ label, status }) => (
                  <KanbanColumn
                    key={status}
                    label={label}
                    status={status}
                    tasks={tasksByStatus(status)}
                    sprintEndDate={sprintEndDate}
                    draggingTaskId={draggingTaskId}
                    dragOverStatus={dragOverStatus}
                    onCreateTask={openCreateModal}
                    onTaskClick={openDetailModal}
                    onDragStart={handleTaskDragStart}
                    onDragEnd={handleTaskDragEnd}
                    onDragOver={handleColumnDragOver}
                    onDrop={handleColumnDrop}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-1">
            {COLUMNS.map(({ label, status }) => (
              <KanbanColumn
                key={status}
                label={label}
                status={status}
                tasks={tasksByStatus(status)}
                sprintEndDate={sprintEndDate}
                draggingTaskId={draggingTaskId}
                dragOverStatus={dragOverStatus}
                showMoreButton
                onCreateTask={openCreateModal}
                onTaskClick={openDetailModal}
                onDragStart={handleTaskDragStart}
                onDragEnd={handleTaskDragEnd}
                onDragOver={handleColumnDragOver}
                onDrop={handleColumnDrop}
              />
            ))}
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
        workspaceId={workspaceId}
        hasPrev={selectedTaskIndex > 0}
        hasNext={selectedTaskIndex < currentTaskList.length - 1}
        onPrev={() => navigateTask('prev')}
        onNext={() => navigateTask('next')}
        onUpdated={loadTasks}
        onDeleted={() => {
          setDetailModalOpen(false);
          setSelectedTask(null);
          void loadTasks();
        }}
        workspaceMembers={workspaceMembers}
        memberDisplayNameMap={memberDisplayNameMap}
      />
    </>
  );
}
