'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '@/components/page-title-context';
import { apiRequest } from '@/lib/client';
import {
  applyWorkspaceMemberDisplayNamesToTasks,
  buildWorkspaceMemberDisplayNameMap,
  fetchWorkspaceMembers,
  type WorkspaceMemberDisplayNameMap,
  type WorkspaceMemberDisplaySource,
} from '@/lib/workspace-member-display';
import { Button, DatePicker, Select, TaskStatusDot } from '@/components/ui';
import { Dialog } from '@/components/ui/dialog';
import { Snackbar } from '@/components/ui/snackbar';
import { TaskCreateModal } from '@/components/task-create-modal';
import { DeleteReasonDialog } from '@/components/delete-reason-dialog';
import { TaskDetailModal, type TaskDetailModalTask } from '@/components/task-detail-modal';
import { getErrorMessage } from '@/lib/error-messages';
import type { TaskStatus } from '@/lib/task-status';
import { SprintSidebar } from './_components/sprint-sidebar';
import { ProjectColumn } from './_components/project-column';

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

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR');
}

function formatCompactDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
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
  const pageTitleCtx = usePageTitle();
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
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberDisplaySource[]>([]);
  const [memberDisplayNameMap, setMemberDisplayNameMap] = useState<WorkspaceMemberDisplayNameMap>({});
  const [sortBy, setSortBy] = useState<ProjectSort>('manual');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [projectNameDraft, setProjectNameDraft] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);
  const [editSprintOpen, setEditSprintOpen] = useState(false);
  const [sprintNameDraft, setSprintNameDraft] = useState('');
  const [sprintGoalDraft, setSprintGoalDraft] = useState('');
  const [sprintRangeDraft, setSprintRangeDraft] = useState<SprintRangeValue | null>(null);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [updatingSprint, setUpdatingSprint] = useState(false);
  const [pendingDeleteSprint, setPendingDeleteSprint] = useState<Sprint | null>(null);
  const [deletingSprintId, setDeletingSprintId] = useState<string | null>(null);
  const [createTaskProjectId, setCreateTaskProjectId] = useState<string | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [pendingDeleteProject, setPendingDeleteProject] = useState<{
    projectId: string;
    name: string;
    taskCount: number;
  } | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [pendingDeleteTask, setPendingDeleteTask] = useState<{ id: string; title: string } | null>(null);
  const [sprintPanelCollapsed, setSprintPanelCollapsed] = useState(false);
  const canCreateProject = Boolean(selectedSprintId) && Boolean(projectNameDraft.trim()) && !creatingProject;
  const canCreateSprint =
    Boolean(sprintNameDraft.trim()) &&
    Boolean(sprintRangeDraft?.start) &&
    Boolean(sprintRangeDraft?.end) &&
    !creatingSprint;

  useEffect(() => {
    pageTitleCtx?.setTitle('스프린트 보드');
  }, [pageTitleCtx]);

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
            ...sprintList.filter((sprint: Sprint) => sprint.sprintId === prioritizedSprintId),
            ...sprintList.filter((sprint: Sprint) => sprint.sprintId !== prioritizedSprintId),
          ]
        : sprintList;

      setSprints(orderedSprintList);
      setSelectedSprintId((prev) => {
        const hasExplicitSelection = Boolean(options && 'selectSprintId' in options);
        const preferredSprintId = hasExplicitSelection ? options?.selectSprintId ?? null : prev;
        const nextSelectedSprintId = orderedSprintList.find((sprint: Sprint) => sprint.sprintId === preferredSprintId)?.sprintId;
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

  async function handleDeleteSprint(reason: string) {
    if (!pendingDeleteSprint) return;
    const sprint = pendingDeleteSprint;
    if (deletingSprintId === sprint.sprintId) return;

    setDeletingSprintId(sprint.sprintId);

    try {
      const result = await apiRequest(`/api/real/workspaces/${workspaceId}/sprints/${sprint.sprintId}`, {
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

      setPendingDeleteSprint(null);
      await loadSprints({ selectSprintId: selectedSprintId === sprint.sprintId ? null : selectedSprintId });
    } catch {
      showSnackbar('스프린트 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingSprintId(null);
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
    if (selectedSprintId || sprints.length === 0) return;
    setSelectedSprintId(sprints[0]?.sprintId ?? null);
  }, [sprints, selectedSprintId]);

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

  async function handleDeleteProject(reason: string) {
    if (!pendingDeleteProject || deletingProjectId === pendingDeleteProject.projectId) return;

    const { projectId } = pendingDeleteProject;
    const deletedProjectTaskIds = new Set((tasksByProject[projectId] ?? []).map((task) => task.id));
    setDeletingProjectId(projectId);

    try {
      const result = await apiRequest(`/api/real/workspaces/${workspaceId}/projects/${projectId}`, {
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

      setProjects((prev) => prev.filter((project) => project.projectId !== projectId));
      setTasksByProject((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      setCollapsedProjects((prev) => {
        if (!(projectId in prev)) return prev;
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
      if (createTaskProjectId === projectId) {
        setCreateTaskProjectId(null);
      }
      if (selectedTask && deletedProjectTaskIds.has(selectedTask.id)) {
        setDetailModalOpen(false);
        setSelectedTask(null);
      }
      setPendingDeleteProject(null);
    } catch {
      showSnackbar('프로젝트 삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingProjectId(null);
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

  function toggleProjectCollapsed(projectId: string) {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !(prev[projectId] ?? false),
    }));
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-4 lg:flex-row">
      <SprintSidebar
        sprints={sprints}
        selectedSprintId={selectedSprintId}
        loading={loading}
        error={error}
        collapsed={sprintPanelCollapsed}
        updatingSprint={updatingSprint}
        deletingSprintId={deletingSprintId}
        onSelectSprint={(sprintId) => setSelectedSprintId(sprintId)}
        onCreateSprint={() => setCreateSprintOpen(true)}
        onEditSprint={(sprintId) => {
          setSelectedSprintId(sprintId);
          setEditSprintOpen(true);
        }}
        onDeleteSprint={(sprint) => setPendingDeleteSprint(sprint)}
        onCollapsedChange={(collapsed) => setSprintPanelCollapsed(collapsed)}
      />

      <main className="flex-1 min-w-0 flex flex-col gap-4 overflow-hidden">
        {!selectedSprint ? (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-line bg-surface text-text-dim">
            왼쪽에서 스프린트를 선택해주세요.
          </div>
        ) : (
          <>
            <section className="hidden shrink-0 rounded-2xl border border-line/40 bg-surface p-4 shadow-sm lg:block sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 hidden lg:block">
                  <p className="m-0 text-[12px] font-medium text-text-dim uppercase tracking-[0.14em]">
                    Sprint Board
                  </p>
                  <h1 className="m-0 mt-2 text-[20px] font-semibold text-text sm:text-[24px]">{selectedSprint.name}</h1>
                  <p className="m-0 mt-2 text-[14px] text-text-soft">
                    {selectedSprint.goal?.trim() || '스프린트 목표가 아직 없습니다.'}
                  </p>
                </div>
                <div className="hidden shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:grid">
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
              <div className="mt-4 hidden gap-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_auto]">
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
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-[12px] font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingProject ? '...' : '+'}
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-line/50 bg-surface-2/40 px-3 py-2 text-[13px] text-text">
                  <span className="text-text-dim shrink-0">정렬</span>
                  <Select
                    value={sortBy}
                    onChange={(v) => setSortBy(v as ProjectSort)}
                    variant="inline"
                    options={[
                      { value: 'manual', label: '기본' },
                      { value: 'name', label: '이름순' },
                      { value: 'progress-desc', label: '진행률순' },
                      { value: 'tasks-desc', label: '태스크 많은 순' },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-line/50 bg-surface-2/40 px-3 py-2 text-[13px] text-text">
                  <span className="text-text-dim shrink-0">필터</span>
                  <Select
                    value={taskFilter}
                    onChange={(v) => setTaskFilter(v as TaskFilter)}
                    variant="inline"
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'todo', label: '할 일' },
                      { value: 'in-progress', label: '진행중' },
                      { value: 'done', label: '완료' },
                      { value: 'unassigned', label: '담당자 없음' },
                    ]}
                  />
                </div>
              </div>
              {moveError ? (
                <div className="mt-3 hidden rounded-xl border border-red/35 bg-red/10 px-4 py-3 text-[13px] text-red lg:block">
                  {moveError}
                </div>
              ) : null}
            </section>

            <section className="flex-1 overflow-y-auto min-h-0 pr-0 lg:pr-1">
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
                  {filteredAndSortedProjects.map(({ project, tasks, metrics }) => (
                    <ProjectColumn
                      key={project.projectId}
                      project={project}
                      tasks={tasks}
                      projects={projects}
                      metrics={metrics}
                      isDropTarget={dragOverProjectId === project.projectId}
                      isCollapsed={collapsedProjects[project.projectId] ?? false}
                      dragState={dragState}
                      movingTaskId={movingTaskId}
                      deletingTaskId={deletingTaskId}
                      deletingProjectId={deletingProjectId}
                      onToggleCollapsed={toggleProjectCollapsed}
                      onCreateTask={(projectId) => setCreateTaskProjectId(projectId)}
                      onDeleteProject={(projectId, name, taskCount) =>
                        setPendingDeleteProject({ projectId, name, taskCount })
                      }
                      onDragOver={(event, projectId) => {
                        event.preventDefault();
                        if (dragState?.fromProjectId !== projectId) {
                          setDragOverProjectId(projectId);
                        }
                      }}
                      onDragLeave={(event, projectId) => {
                        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                        setDragOverProjectId((prev) => (prev === projectId ? null : prev));
                      }}
                      onDrop={(event, projectId) => {
                        event.preventDefault();
                        handleDrop(projectId);
                      }}
                      onTaskDragStart={(event, taskId, fromProjectId) => {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', taskId);
                        setDragState({ taskId, fromProjectId });
                        setDragOverProjectId(null);
                      }}
                      onTaskDragEnd={() => {
                        setDragState(null);
                        setDragOverProjectId(null);
                      }}
                      onTaskClick={(task) => openDetailModal(task)}
                      onMoveTask={(taskId, fromProjectId, toProjectId) => {
                        void commitTaskMove(taskId, fromProjectId, toProjectId);
                      }}
                      onDeleteTask={(taskId, title) => setPendingDeleteTask({ id: taskId, title })}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
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
      <DeleteReasonDialog
        open={Boolean(pendingDeleteProject)}
        onClose={() => {
          if (!deletingProjectId) setPendingDeleteProject(null);
        }}
        onConfirm={handleDeleteProject}
        loading={Boolean(deletingProjectId)}
        title="프로젝트 삭제"
        description={
          pendingDeleteProject
            ? `'${pendingDeleteProject.name}' 프로젝트를 삭제하는 사유를 입력해 주세요.${pendingDeleteProject.taskCount > 0 ? ` 연결된 태스크 ${pendingDeleteProject.taskCount}개도 함께 영향받을 수 있습니다.` : ''}`
            : '프로젝트 삭제 사유를 입력해 주세요.'
        }
      />
      <DeleteReasonDialog
        open={Boolean(pendingDeleteSprint)}
        onClose={() => {
          if (!deletingSprintId) setPendingDeleteSprint(null);
        }}
        onConfirm={handleDeleteSprint}
        loading={Boolean(deletingSprintId)}
        title="스프린트 삭제"
        description={
          pendingDeleteSprint
            ? `'${pendingDeleteSprint.name}' 스프린트를 삭제하는 사유를 입력해 주세요.${selectedSprintId === pendingDeleteSprint.sprintId ? ` 현재 연결된 프로젝트 ${projects.length}개가 함께 영향받을 수 있습니다.` : ' 연결된 프로젝트와 태스크 상태에 영향이 있을 수 있습니다.'}`
            : '스프린트 삭제 사유를 입력해 주세요.'
        }
      />
    </div>
  );
}
