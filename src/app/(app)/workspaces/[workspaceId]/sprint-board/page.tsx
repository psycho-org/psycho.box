'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '@/lib/client';
import {
  applyWorkspaceMemberDisplayNamesToTasks,
  buildWorkspaceMemberDisplayNameMap,
  fetchWorkspaceMembers,
  type WorkspaceMemberDisplayNameMap,
  type WorkspaceMemberDisplaySource,
} from '@/lib/workspace-member-display';
import { Button, DatePicker, TaskStatusDot } from '@/components/ui';
import { Dialog } from '@/components/ui/dialog';
import { Snackbar } from '@/components/ui/snackbar';
import { TaskCreateModal } from '@/components/task-create-modal';
import { DeleteReasonDialog } from '@/components/delete-reason-dialog';
import { TaskDetailModal, type TaskDetailModalTask } from '@/components/task-detail-modal';
import { getErrorMessage } from '@/lib/error-messages';
import type { TaskStatus } from '@/lib/task-status';

interface Sprint {
  sprintId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
}

interface Project {
  projectId: string;
  name: string;
  progress: {
    totalCount: number;
    completedCount: number;
    progress: number;
  };
}

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  assignee?: { id: string; name: string; email: string } | null;
  dueDate?: string | null;
  description?: string | null;
}

interface DragState {
  taskId: string;
  fromProjectId: string;
}

type ProjectSort = 'manual' | 'name' | 'progress-desc' | 'tasks-desc';
type TaskFilter = 'all' | 'todo' | 'in-progress' | 'done' | 'unassigned';

const DONE_STATUSES: TaskStatus[] = ['DONE'];

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2v4M16 2v4M3 10h18" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
    </svg>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

function SprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h13" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  );
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

function PanelToggleIcon({ className, collapsed }: { className?: string; collapsed: boolean }) {
  return (
    <svg
      className={`${className} transition-transform ${collapsed ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR');
}

function isDone(status: TaskStatus) {
  return DONE_STATUSES.includes(status);
}

interface SprintRangeValue {
  start: string;
  end: string;
}

function normalizeSprintGoal(goal: string) {
  return goal.trim() || null;
}

export default function SprintBoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasksByProject, setTasksByProject] = useState<Record<string, Task[]>>({});
  const [boardLoading, setBoardLoading] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVariant, setSnackbarVariant] = useState<'default' | 'success' | 'error'>('default');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskDetailModalTask | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberDisplaySource[]>([]);
  const [memberDisplayNameMap, setMemberDisplayNameMap] = useState<WorkspaceMemberDisplayNameMap>({});
  const [sortBy, setSortBy] = useState<ProjectSort>('manual');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [editSprintOpen, setEditSprintOpen] = useState(false);
  const [deleteSprintOpen, setDeleteSprintOpen] = useState(false);
  const [sprintNameDraft, setSprintNameDraft] = useState('');
  const [sprintGoalDraft, setSprintGoalDraft] = useState('');
  const [sprintRangeDraft, setSprintRangeDraft] = useState<SprintRangeValue | null>(null);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [updatingSprint, setUpdatingSprint] = useState(false);
  const [deletingSprint, setDeletingSprint] = useState(false);
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [pendingDeleteTask, setPendingDeleteTask] = useState<{ id: string; title: string } | null>(null);
  const [sprintPanelCollapsed, setSprintPanelCollapsed] = useState(false);
  const [toggleButtonLeft, setToggleButtonLeft] = useState<number | null>(null);
  const sprintPanelRef = useRef<HTMLElement | null>(null);
  const canCreateProject = Boolean(selectedSprintId) && Boolean(projectNameDraft.trim()) && !creatingProject;
  const canCreateSprint =
    Boolean(sprintNameDraft.trim()) &&
    Boolean(sprintRangeDraft?.start) &&
    Boolean(sprintRangeDraft?.end) &&
    !creatingSprint;

  const loadSprints = useCallback(async (options?: { prioritizeSprintId?: string | null; selectSprintId?: string | null }) => {
    if (!workspaceId) return;

    setLoading(true);

    try {
      const result = await apiRequest<{ data: Sprint[] }>(`/api/real/workspaces/${workspaceId}/sprints?page=0&size=100`);

      if (!result.ok) {
        setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
        return;
      }

      const sprintList = Array.isArray(result.data) ? result.data : (result.data as any)?.content || [];
      const prioritizedSprintId = options?.prioritizeSprintId;
      const orderedSprintList = prioritizedSprintId
        ? [
            ...sprintList.filter((sprint) => sprint.sprintId === prioritizedSprintId),
            ...sprintList.filter((sprint) => sprint.sprintId !== prioritizedSprintId),
          ]
        : sprintList;

      setSprints(orderedSprintList);
      setSelectedSprintId((prev) => {
        const preferredSprintId = options?.selectSprintId ?? prev;
        const nextSelectedSprintId = orderedSprintList.find((sprint) => sprint.sprintId === preferredSprintId)?.sprintId;
        return nextSelectedSprintId ?? orderedSprintList[0]?.sprintId ?? null;
      });
      setError(null);
    } catch {
      setError('스프린트를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    void loadSprints();
  }, [workspaceId, loadSprints]);

  const showSnackbar = useCallback(
    (message: string, variant: 'default' | 'success' | 'error') => {
      setSnackbarMessage(message);
      setSnackbarVariant(variant);
      setSnackbarOpen(true);
    },
    [],
  );

  useEffect(() => {
    if (!createSprintOpen && !creatingSprint) {
      setSprintNameDraft('');
      setSprintGoalDraft('');
      setSprintRangeDraft(null);
    }
  }, [createSprintOpen, creatingSprint]);

  async function handleCreateSprint() {
    const name = sprintNameDraft.trim();
    const startDate = sprintRangeDraft?.start;
    const endDate = sprintRangeDraft?.end;
    if (!name || !startDate || !endDate || creatingSprint) return;

    setCreatingSprint(true);

    try {
      const result = await apiRequest<{ sprintId?: string }>(
        `/api/real/workspaces/${workspaceId}/sprints`,
        {
          method: 'POST',
          body: JSON.stringify({
            name,
            goal: normalizeSprintGoal(sprintGoalDraft),
            startDate: `${startDate}T00:00:00.000Z`,
            endDate: `${endDate}T23:59:59.000Z`,
          }),
        },
      );

      if (!result.ok) {
        showSnackbar(
          getErrorMessage({ code: result.code, message: result.message, status: result.status }),
          'error',
        );
        return;
      }

      setCreateSprintOpen(false);
      await loadSprints({
        prioritizeSprintId: result.data?.sprintId ?? null,
        selectSprintId: result.data?.sprintId ?? null,
      });
    } catch {
      showSnackbar('스프린트 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setCreatingSprint(false);
    }
  }

  async function handleUpdateSprint() {
    if (!selectedSprint || !sprintRangeDraft || updatingSprint) return;
    const name = sprintNameDraft.trim();
    if (!name) return;

    setUpdatingSprint(true);

    try {
      const result = await apiRequest(
        `/api/real/workspaces/${workspaceId}/sprints/${selectedSprint.sprintId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            goal: normalizeSprintGoal(sprintGoalDraft),
            startDate: `${sprintRangeDraft.start}T00:00:00.000Z`,
            endDate: `${sprintRangeDraft.end}T23:59:59.000Z`,
          }),
        },
      );

      if (!result.ok) {
        showSnackbar(
          getErrorMessage({ code: result.code, message: result.message, status: result.status }),
          'error',
        );
        return;
      }

      setEditSprintOpen(false);
      await loadSprints({ selectSprintId: selectedSprint.sprintId });
    } catch {
      showSnackbar('스프린트 수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setUpdatingSprint(false);
    }
  }

  async function handleDeleteSprint() {
    if (!selectedSprint || deletingSprint) return;

    setDeletingSprint(true);

    try {
      const result = await apiRequest(`/api/real/workspaces/${workspaceId}/sprints/${selectedSprint.sprintId}`, {
        method: 'DELETE',
      });

      if (!result.ok) {
        showSnackbar(
          getErrorMessage({ code: result.code, message: result.message, status: result.status }),
          'error',
        );
        return;
      }

      setDeleteSprintOpen(false);
      await loadSprints();
    } catch {
      showSnackbar('스프린트 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingSprint(false);
    }
  }

  const loadBoard = useCallback(async (options?: { prioritizeProjectId?: string | null }) => {
    if (!workspaceId || !selectedSprintId) {
      setProjects([]);
      setTasksByProject({});
      return;
    }

    setBoardLoading(true);
    setMoveError(null);

    try {
      const projectResult = await apiRequest<{ data: Project[] }>(
        `/api/real/workspaces/${workspaceId}/sprints/${selectedSprintId}/projects`,
      );

      if (!projectResult.ok) {
        setError(
          getErrorMessage({
            code: projectResult.code,
            message: projectResult.message,
            status: projectResult.status,
          }),
        );
        return;
      }

      const projectList = Array.isArray(projectResult.data) ? projectResult.data : [];
      const prioritizedProjectId = options?.prioritizeProjectId;
      const orderedProjectList = prioritizedProjectId
        ? [
            ...projectList.filter((project) => project.projectId === prioritizedProjectId),
            ...projectList.filter((project) => project.projectId !== prioritizedProjectId),
          ]
        : projectList;
      setProjects(orderedProjectList);

      if (orderedProjectList.length === 0) {
        setTasksByProject({});
        setError(null);
        return;
      }

      const [members, ...taskResults] = await Promise.all([
        fetchWorkspaceMembers(workspaceId),
        ...orderedProjectList.map((project) =>
          apiRequest<{ data: Task[] }>(
            `/api/real/workspaces/${workspaceId}/projects/${project.projectId}/tasks?page=0&size=100`,
          ),
        ),
      ]);
      const nextMemberDisplayNameMap = buildWorkspaceMemberDisplayNameMap(members);
      setWorkspaceMembers(members);
      setMemberDisplayNameMap(nextMemberDisplayNameMap);

      const nextTasksByProject = orderedProjectList.reduce<Record<string, Task[]>>((acc, project, index) => {
        const taskResult = taskResults[index];
        const list = taskResult?.ok
          ? Array.isArray(taskResult.data)
            ? taskResult.data
            : (taskResult.data as any)?.content || []
          : [];

        acc[project.projectId] = applyWorkspaceMemberDisplayNamesToTasks(list, nextMemberDisplayNameMap);
        return acc;
      }, {});

      setTasksByProject(nextTasksByProject);
      setError(null);
    } catch {
      setError('스프린트 보드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setBoardLoading(false);
    }
  }, [workspaceId, selectedSprintId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => sprint.sprintId === selectedSprintId) ?? null,
    [sprints, selectedSprintId],
  );
  const sprintMinDate = selectedSprint?.startDate?.slice(0, 10);
  const sprintMaxDate = selectedSprint?.endDate?.slice(0, 10);

  useEffect(() => {
    if (!editSprintOpen || !selectedSprint) return;
    setSprintNameDraft(selectedSprint.name);
    setSprintGoalDraft(selectedSprint.goal ?? '');
    setSprintRangeDraft({
      start: selectedSprint.startDate.slice(0, 10),
      end: selectedSprint.endDate.slice(0, 10),
    });
  }, [editSprintOpen, selectedSprint]);

  const totalTaskCount = useMemo(
    () => Object.values(tasksByProject).reduce((sum, tasks) => sum + tasks.length, 0),
    [tasksByProject],
  );

  const completedTaskCount = useMemo(
    () =>
      Object.values(tasksByProject).reduce(
        (sum, tasks) => sum + tasks.filter((task) => isDone(task.status)).length,
        0,
      ),
    [tasksByProject],
  );

  const currentTaskList = useMemo(
    () => projects.flatMap((project) => tasksByProject[project.projectId] ?? []),
    [projects, tasksByProject],
  );

  const selectedTaskIndex = selectedTask
    ? currentTaskList.findIndex((task) => task.id === selectedTask.id)
    : -1;

  const getProjectMetrics = useCallback((projectId: string, fallback: Project['progress']) => {
    const tasks = tasksByProject[projectId];
    if (!tasks) return fallback;

    const totalCount = tasks.length;
    const completedCount = tasks.filter((task) => isDone(task.status)).length;
    return {
      totalCount,
      completedCount,
      progress: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
    };
  }, [tasksByProject]);

  const filteredAndSortedProjects = useMemo(() => {
    const withVisibleTasks = projects.map((project) => {
      const tasks = tasksByProject[project.projectId] ?? [];
      const filteredTasks = tasks.filter((task) => {
        if (taskFilter === 'all') return true;
        if (taskFilter === 'todo') return task.status === 'TODO';
        if (taskFilter === 'in-progress') return task.status === 'IN_PROGRESS';
        if (taskFilter === 'done') return isDone(task.status);
        if (taskFilter === 'unassigned') return !task.assignee;
        return true;
      });

      return {
        project,
        tasks: filteredTasks,
        metrics: getProjectMetrics(project.projectId, project.progress),
      };
    });

    if (sortBy === 'manual') return withVisibleTasks;
    if (sortBy === 'name') {
      return [...withVisibleTasks].sort((a, b) => a.project.name.localeCompare(b.project.name, 'ko'));
    }
    if (sortBy === 'progress-desc') {
      return [...withVisibleTasks].sort((a, b) => b.metrics.progress - a.metrics.progress);
    }
    return [...withVisibleTasks].sort((a, b) => b.tasks.length - a.tasks.length);
  }, [projects, tasksByProject, sortBy, taskFilter, getProjectMetrics]);

  function moveTaskLocally(taskId: string, fromProjectId: string, toProjectId: string) {
    let movedTask: Task | null = null;

    setTasksByProject((prev) => {
      const fromTasks = prev[fromProjectId] ?? [];
      const toTasks = prev[toProjectId] ?? [];
      movedTask = fromTasks.find((task) => task.id === taskId) ?? null;
      if (!movedTask) return prev;

      return {
        ...prev,
        [fromProjectId]: fromTasks.filter((task) => task.id !== taskId),
        [toProjectId]: [...toTasks, movedTask],
      };
    });

    return movedTask;
  }

  async function commitTaskMove(taskId: string, fromProjectId: string, toProjectId: string) {
    if (fromProjectId === toProjectId || movingTaskId === taskId) return;

    setMoveError(null);
    setMovingTaskId(taskId);

    const previousState = tasksByProject;
    const movedTask = moveTaskLocally(taskId, fromProjectId, toProjectId);
    if (!movedTask) {
      setMovingTaskId(null);
      return;
    }

    const result = await apiRequest(
      `/api/real/workspaces/${workspaceId}/projects/${fromProjectId}/tasks/${taskId}/move`,
      {
        method: 'PATCH',
        body: JSON.stringify({ toProjectId }),
      },
    );

    if (!result.ok) {
      setTasksByProject(previousState);
      const message = getErrorMessage({ code: result.code, message: result.message, status: result.status });
      setMoveError(message);
      showSnackbar(message, 'error');
    } else {
      showSnackbar('태스크를 다른 프로젝트로 이동했습니다.', 'success');
    }

    setMovingTaskId(null);
  }

  function handleDrop(toProjectId: string) {
    if (!dragState) return;
    setDragOverProjectId(null);
    void commitTaskMove(dragState.taskId, dragState.fromProjectId, toProjectId);
    setDragState(null);
  }

  async function handleCreateProject() {
    const name = projectNameDraft.trim();
    if (!name || !selectedSprintId || creatingProject) return;

    setCreatingProject(true);

    try {
      const result = await apiRequest<{ projectId?: string }>(
        `/api/real/workspaces/${workspaceId}/sprints/${selectedSprintId}/projects`,
        {
          method: 'POST',
          body: JSON.stringify({ name }),
        },
      );

      if (!result.ok) {
        showSnackbar(
          getErrorMessage({ code: result.code, message: result.message, status: result.status }),
          'error',
        );
        return;
      }

      setProjectNameDraft('');
      await loadBoard({ prioritizeProjectId: result.data?.projectId ?? null });
    } catch {
      showSnackbar('프로젝트 생성 중 오류가 발생했습니다.', 'error');
    } finally {
      setCreatingProject(false);
    }
  }

  async function handleDeleteTask(reason: string) {
    if (!pendingDeleteTask) return;
    const { id: taskId } = pendingDeleteTask;
    if (deletingTaskId === taskId) return;

    setDeletingTaskId(taskId);

    try {
      const result = await apiRequest(`/api/real/workspaces/${workspaceId}/tasks/${taskId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });

      if (!result.ok) {
        showSnackbar(
          getErrorMessage({ code: result.code, message: result.message, status: result.status }),
          'error',
        );
        return;
      }

      setTasksByProject((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([projectId, tasks]) => [
            projectId,
            tasks.filter((task) => task.id !== taskId),
          ]),
        ),
      );

      if (selectedTask?.id === taskId) {
        setDetailModalOpen(false);
        setSelectedTask(null);
      }
      setPendingDeleteTask(null);
    } catch {
      showSnackbar('태스크 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingTaskId(null);
    }
  }

  function toDetailTask(task: Task): TaskDetailModalTask {
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.dueDate,
      description: task.description,
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            name: task.assignee.name,
            email: task.assignee.email,
          }
        : null,
    };
  }

  function openDetailModal(task: Task) {
    setSelectedTask(toDetailTask(task));
    setDetailModalOpen(true);
  }

  function navigateTask(direction: 'prev' | 'next') {
    const nextIndex = direction === 'prev' ? selectedTaskIndex - 1 : selectedTaskIndex + 1;
    if (nextIndex < 0 || nextIndex >= currentTaskList.length) return;
    openDetailModal(currentTaskList[nextIndex]);
  }

  useEffect(() => {
    function updateToggleButtonLeft() {
      const panelRect = sprintPanelRef.current?.getBoundingClientRect();
      if (!panelRect) return;
      setToggleButtonLeft(panelRect.right);
    }

    updateToggleButtonLeft();
    const panelElement = sprintPanelRef.current;
    const resizeObserver =
      panelElement && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateToggleButtonLeft())
        : null;

    if (panelElement && resizeObserver) {
      resizeObserver.observe(panelElement);
    }

    window.addEventListener('resize', updateToggleButtonLeft);
    window.addEventListener('scroll', updateToggleButtonLeft, { passive: true });
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateToggleButtonLeft);
      window.removeEventListener('scroll', updateToggleButtonLeft);
    };
  }, [sprintPanelCollapsed]);

  return (
    <div className="relative flex gap-4 h-full min-h-0">
      <aside
        ref={sprintPanelRef}
        className={`shrink-0 flex flex-col overflow-hidden transition-all duration-200 ${
          sprintPanelCollapsed
            ? 'w-4 items-center justify-center bg-transparent border-transparent shadow-none'
            : 'w-72 bg-surface border border-line/40 rounded-2xl shadow-sm'
        }`}
      >
        {sprintPanelCollapsed ? (
          <div className="h-full w-px rounded-full bg-line/60" />
        ) : (
          <>
            <div className="p-4 border-b border-line/60">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-text m-0">스프린트 보드</h2>
                  <p className="m-0 mt-1 text-[12px] text-text-dim">스프린트를 고르면 프로젝트 묶음을 한 화면에서 편집합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateSprintOpen(true)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line/60 bg-surface-2/50 px-3 py-1.5 text-[12px] font-medium text-text transition-colors hover:border-accent/40 hover:text-accent-soft"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
              {loading ? (
                <p className="text-text-soft text-[13px] px-2 py-2">로딩 중...</p>
              ) : error && sprints.length === 0 ? (
                <p className="text-red text-[13px] px-2 py-2">{error}</p>
              ) : sprints.length === 0 ? (
                <p className="text-text-soft text-[13px] px-2 py-2">스프린트가 없습니다.</p>
              ) : (
                sprints.map((sprint) => (
                  <button
                    key={sprint.sprintId}
                    type="button"
                    onClick={() => setSelectedSprintId(sprint.sprintId)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-colors ${
                      selectedSprintId === sprint.sprintId
                        ? 'bg-accent-dim/80 text-accent-soft border border-accent/20'
                        : 'text-text hover:bg-surface-2 border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-[14px] truncate">{sprint.name}</div>
                    <div className="text-[12px] opacity-70 mt-1 flex justify-between">
                      <span>{formatDate(sprint.startDate)}</span>
                      <span>{formatDate(sprint.endDate)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
        {!selectedSprint ? (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-line bg-surface text-text-dim">
            왼쪽에서 스프린트를 선택해주세요.
          </div>
        ) : (
          <>
            <section className="shrink-0 bg-surface border border-line/40 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="m-0 text-[12px] font-medium text-text-dim uppercase tracking-[0.14em]">
                    Sprint Board
                  </p>
                  <h1 className="m-0 mt-2 text-[24px] font-semibold text-text">{selectedSprint.name}</h1>
                  <p className="m-0 mt-2 text-[14px] text-text-soft">
                    {selectedSprint.goal?.trim() || '스프린트 목표가 아직 없습니다.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
                  <div className="rounded-2xl border border-line/50 bg-surface-2/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-text-dim text-[12px]">
                      <CalendarIcon className="size-4" />
                      기간
                    </div>
                    <div className="mt-2 text-[13px] text-text">
                      {formatDate(selectedSprint.startDate)} - {formatDate(selectedSprint.endDate)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-line/50 bg-surface-2/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-text-dim text-[12px]">
                      <StackIcon className="size-4" />
                      프로젝트
                    </div>
                    <div className="mt-2 text-[20px] font-semibold text-text">{projects.length}</div>
                  </div>
                  <div className="rounded-2xl border border-line/50 bg-surface-2/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-text-dim text-[12px]">
                      <TaskStatusDot status="DONE" className="size-3" />
                      완료 / 전체
                    </div>
                    <div className="mt-2 text-[20px] font-semibold text-text">
                      {completedTaskCount} / {totalTaskCount}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="flex items-center gap-2 rounded-xl border border-line/50 bg-surface-2/40 px-3 py-2">
                  <input
                    value={projectNameDraft}
                    onChange={(event) => setProjectNameDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleCreateProject();
                      }
                    }}
                    disabled={!selectedSprintId || creatingProject}
                    placeholder={selectedSprintId ? '새 프로젝트 이름' : '먼저 스프린트를 선택하세요'}
                    className="w-full bg-transparent text-[13px] text-text outline-none placeholder:text-text-dim"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCreateProject()}
                    disabled={!canCreateProject}
                    className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingProject ? '...' : '+'}
                  </button>
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-line/50 bg-surface-2/40 px-3 py-2 text-[13px] text-text">
                  <span className="text-text-dim">정렬</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as ProjectSort)}
                    className="bg-transparent outline-none"
                  >
                    <option value="manual">기본</option>
                    <option value="name">이름순</option>
                    <option value="progress-desc">진행률순</option>
                    <option value="tasks-desc">태스크 많은 순</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-line/50 bg-surface-2/40 px-3 py-2 text-[13px] text-text">
                  <span className="text-text-dim">필터</span>
                  <select
                    value={taskFilter}
                    onChange={(event) => setTaskFilter(event.target.value as TaskFilter)}
                    className="bg-transparent outline-none"
                  >
                    <option value="all">전체</option>
                    <option value="todo">할 일</option>
                    <option value="in-progress">진행중</option>
                    <option value="done">완료</option>
                    <option value="unassigned">담당자 없음</option>
                  </select>
                </label>
              </div>
              {moveError ? (
                <div className="mt-3 rounded-xl border border-red/35 bg-red/10 px-4 py-3 text-[13px] text-red">
                  {moveError}
                </div>
              ) : null}
            </section>

            <section className="flex-1 overflow-y-auto pr-1 min-h-0">
              {boardLoading ? (
                <div className="h-full flex items-center justify-center rounded-2xl border border-line/40 bg-surface text-text-soft">
                  보드를 불러오는 중...
                </div>
              ) : projects.length === 0 ? (
                <div className="h-full flex items-center justify-center rounded-2xl border border-line/40 bg-surface text-text-soft">
                  이 스프린트에 등록된 프로젝트가 없습니다.
                </div>
              ) : (
                <div className="space-y-4 pb-4">
                  {filteredAndSortedProjects.map(({ project, tasks, metrics }) => {
                    const isDropTarget = dragOverProjectId === project.projectId;

                    return (
                      <section
                        key={project.projectId}
                        className={`rounded-2xl border bg-surface shadow-sm transition-all ${
                          isDropTarget
                            ? 'border-accent shadow-[0_0_0_2px_rgba(222,133,83,0.25)] bg-accent-dim/20 scale-[1.003]'
                            : 'border-line/40'
                        }`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          if (dragState?.fromProjectId !== project.projectId) {
                            setDragOverProjectId(project.projectId);
                          }
                        }}
                        onDragLeave={(event) => {
                          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                          setDragOverProjectId((prev) => (prev === project.projectId ? null : prev));
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleDrop(project.projectId);
                        }}
                      >
                        <div className="sticky top-0 z-10 rounded-t-2xl border-b border-line/40 bg-surface/95 backdrop-blur px-5 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <h3 className="m-0 text-[16px] font-semibold text-text truncate">{project.name}</h3>
                              <p className="m-0 mt-1 text-[12px] text-text-dim">
                                {tasks.length === 0
                                  ? '비어 있는 프로젝트입니다. 태스크를 드롭해 시작할 수 있습니다.'
                                  : `${tasks.length}개의 태스크가 이 프로젝트에 연결되어 있습니다.`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <button
                                type="button"
                                onClick={() => setCreateTaskProjectId(project.projectId)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-line/60 bg-surface-2/50 px-3 py-1.5 text-[12px] font-medium text-text transition-colors hover:border-accent/40 hover:text-accent-soft"
                              >
                                <PlusIcon className="size-3.5" />
                              </button>
                              <span className="text-[12px] text-text-dim tabular-nums">
                                {metrics.completedCount} / {metrics.totalCount}
                              </span>
                              <div className="w-24 h-2 bg-surface-3 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-accent transition-all duration-300"
                                  style={{ width: `${metrics.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

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
                                  onDragStart={(event) => {
                                    event.dataTransfer.effectAllowed = 'move';
                                    event.dataTransfer.setData('text/plain', task.id);
                                    setDragState({ taskId: task.id, fromProjectId: project.projectId });
                                    setDragOverProjectId(null);
                                  }}
                                  onDragEnd={() => {
                                    setDragState(null);
                                    setDragOverProjectId(null);
                                  }}
                                  onClick={() => openDetailModal(task)}
                                  className={`rounded-2xl border px-4 py-3 transition-all ${
                                    movingTaskId === task.id
                                      ? 'opacity-60 border-line/50 bg-surface-2/40'
                                      : dragState?.taskId === task.id
                                        ? 'opacity-35 rotate-[0.6deg] scale-[0.985] border-accent/70 bg-accent-dim/20 shadow-[0_10px_24px_rgba(0,0,0,0.22)]'
                                        : 'border-line/50 bg-surface-2/40 hover:shadow-sm hover:border-line/80'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
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
                                    <div className="flex items-start gap-2 shrink-0">
                                      <select
                                        aria-label="프로젝트 이동"
                                        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[12px] text-text"
                                        value={project.projectId}
                                        onClick={(event) => event.stopPropagation()}
                                        onChange={(event) => {
                                          event.stopPropagation();
                                          const toProjectId = event.target.value;
                                          if (toProjectId !== project.projectId) {
                                            void commitTaskMove(task.id, project.projectId, toProjectId);
                                          }
                                        }}
                                      >
                                        {projects.map((targetProject) => (
                                          <option key={targetProject.projectId} value={targetProject.projectId}>
                                            {targetProject.name}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        aria-label="태스크 삭제"
                                        title="태스크 삭제"
                                        disabled={deletingTaskId === task.id}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setPendingDeleteTask({ id: task.id, title: task.title });
                                        }}
                                        className="rounded-lg border border-line/70 bg-surface px-2 py-1.5 text-text-dim transition-colors hover:border-red/40 hover:text-red disabled:cursor-not-allowed disabled:opacity-50"
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
                      </section>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <button
        type="button"
        onClick={() => setSprintPanelCollapsed((prev) => !prev)}
        className="fixed top-[50svh] z-20 -translate-x-1/2 -translate-y-1/2 group flex h-28 w-2.5 items-center justify-center rounded-full border border-line/60 bg-surface/88 text-text-dim shadow-sm backdrop-blur transition-[width,background-color,border-color,color] duration-200 hover:w-3 hover:border-accent/40 hover:bg-surface-2 hover:text-text"
        style={toggleButtonLeft ? { left: toggleButtonLeft } : undefined}
        aria-label={sprintPanelCollapsed ? '스프린트 패널 펼치기' : '스프린트 패널 접기'}
        title={sprintPanelCollapsed ? '스프린트 패널 펼치기' : '스프린트 패널 접기'}
      >
        <PanelToggleIcon className="size-3.5 group-hover:scale-110" collapsed={sprintPanelCollapsed} />
      </button>
      <TaskDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        minDate={sprintMinDate}
        maxDate={sprintMaxDate}
        hasPrev={selectedTaskIndex > 0}
        hasNext={selectedTaskIndex >= 0 && selectedTaskIndex < currentTaskList.length - 1}
        onPrev={() => navigateTask('prev')}
        onNext={() => navigateTask('next')}
        onUpdated={() => {
          void loadBoard();
          showSnackbar('태스크 변경사항을 반영했습니다.', 'success');
        }}
        onDeleted={() => {
          setDetailModalOpen(false);
          setSelectedTask(null);
          void loadBoard();
        }}
        workspaceMembers={workspaceMembers}
        memberDisplayNameMap={memberDisplayNameMap}
      />
      <TaskCreateModal
        open={Boolean(createTaskProjectId)}
        onClose={() => setCreateTaskProjectId(null)}
        workspaceId={workspaceId}
        projectId={createTaskProjectId}
        minDate={sprintMinDate}
        maxDate={sprintMaxDate}
        defaultStatus="TODO"
        onSuccess={() => {
          setCreateTaskProjectId(null);
          void loadBoard();
        }}
      />
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        variant={snackbarVariant}
        onClose={() => setSnackbarOpen(false)}
      />
      <DeleteReasonDialog
        open={Boolean(pendingDeleteTask)}
        onClose={() => {
          if (!deletingTaskId) setPendingDeleteTask(null);
        }}
        onConfirm={handleDeleteTask}
        loading={Boolean(deletingTaskId)}
        description={
          pendingDeleteTask
            ? `'${pendingDeleteTask.title}' 태스크를 삭제하는 사유를 입력해 주세요.`
            : '삭제 사유를 입력해 주세요.'
        }
      />
      <Dialog open={createSprintOpen} onClose={() => !creatingSprint && setCreateSprintOpen(false)} title="스프린트 추가">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreateSprint();
          }}
        >
          <div>
            <label htmlFor="sprint-name" className="block text-[13px] font-medium text-text-soft mb-1.5">
              이름 <span className="text-red">*</span>
            </label>
            <input
              id="sprint-name"
              type="text"
              value={sprintNameDraft}
              onChange={(event) => setSprintNameDraft(event.target.value)}
              placeholder="스프린트 이름"
              className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-lg text-[14px] placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              disabled={creatingSprint}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="sprint-goal" className="block text-[13px] font-medium text-text-soft mb-1.5">
              목표
            </label>
            <textarea
              id="sprint-goal"
              value={sprintGoalDraft}
              onChange={(event) => setSprintGoalDraft(event.target.value)}
              placeholder="스프린트 목표 (선택)"
              rows={3}
              className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-lg text-[14px] placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
              disabled={creatingSprint}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-soft mb-1.5">
              기간 <span className="text-red">*</span>
            </label>
            <DatePicker
              mode="range"
              value={sprintRangeDraft}
              onChange={(value) => setSprintRangeDraft(value as SprintRangeValue | null)}
              placeholder="스프린트 기간 선택"
              disabled={creatingSprint}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateSprintOpen(false)}
              disabled={creatingSprint}
            >
              취소
            </Button>
            <Button type="submit" loading={creatingSprint} disabled={!canCreateSprint}>
              +
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog open={editSprintOpen} onClose={() => !updatingSprint && setEditSprintOpen(false)} title="스프린트 수정">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleUpdateSprint();
          }}
        >
          <div>
            <label htmlFor="edit-sprint-name" className="block text-[13px] font-medium text-text-soft mb-1.5">
              이름 <span className="text-red">*</span>
            </label>
            <input
              id="edit-sprint-name"
              type="text"
              value={sprintNameDraft}
              onChange={(event) => setSprintNameDraft(event.target.value)}
              placeholder="스프린트 이름"
              className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-lg text-[14px] placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
              disabled={updatingSprint}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="edit-sprint-goal" className="block text-[13px] font-medium text-text-soft mb-1.5">
              목표
            </label>
            <textarea
              id="edit-sprint-goal"
              value={sprintGoalDraft}
              onChange={(event) => setSprintGoalDraft(event.target.value)}
              placeholder="스프린트 목표 (선택)"
              rows={3}
              className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-lg text-[14px] placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none"
              disabled={updatingSprint}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-text-soft mb-1.5">
              기간 <span className="text-red">*</span>
            </label>
            <DatePicker
              mode="range"
              value={sprintRangeDraft}
              onChange={(value) => setSprintRangeDraft(value as SprintRangeValue | null)}
              placeholder="스프린트 기간 선택"
              disabled={updatingSprint}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditSprintOpen(false)}
              disabled={updatingSprint}
            >
              취소
            </Button>
            <Button type="submit" loading={updatingSprint} disabled={!canCreateSprint}>
              저장
            </Button>
          </div>
        </form>
      </Dialog>
      <Dialog open={deleteSprintOpen} onClose={() => !deletingSprint && setDeleteSprintOpen(false)} title="스프린트 삭제">
        <div className="flex flex-col gap-4">
          <p className="m-0 text-[13px] text-text-soft">
            {selectedSprint
              ? `'${selectedSprint.name}' 스프린트를 삭제할까요? 연결된 프로젝트와 태스크 상태에 영향이 있을 수 있습니다.`
              : '선택된 스프린트를 삭제할까요?'}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeleteSprintOpen(false)} disabled={deletingSprint}>
              취소
            </Button>
            <Button type="button" variant="danger" onClick={() => void handleDeleteSprint()} loading={deletingSprint}>
              삭제
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
