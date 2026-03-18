'use client';

import Link from 'next/link';
import { use, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { usePageTitle } from '@/components/page-title-context';
import { TaskStatusDot } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';
import { TASK_STATUS_LABELS, type TaskStatus } from '@/lib/task-status';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: { id: string; name?: string; email?: string } | null;
  sprintId?: string | null;
}

interface SprintSummary {
  sprintId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface EnrichedTask extends Task {
  sprintEndDate?: string | null;
}

interface IssueTask {
  task: EnrichedTask;
  label: string;
  tone: string;
}

const STATUS_ORDER: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'BACKLOG'];

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR');
}

function getDisplayName(task: EnrichedTask) {
  return task.assignee?.name || task.assignee?.email || '담당자 없음';
}

function getIssue(task: EnrichedTask): IssueTask | null {
  const isDone = task.status === 'DONE' || task.status === 'CANCELLED';
  if (isDone) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    if (dueDate < today) {
      return {
        task,
        label: '마감일 지남',
        tone: 'border-orange/30 bg-orange/10 text-orange',
      };
    }
  }

  if (task.sprintEndDate) {
    const sprintEndDate = new Date(task.sprintEndDate);
    sprintEndDate.setHours(0, 0, 0, 0);
    if (sprintEndDate < today) {
      return {
        task,
        label: '스프린트 종료',
        tone: 'border-red/30 bg-red/10 text-red',
      };
    }
  }

  if (!task.dueDate && task.status === 'IN_PROGRESS') {
    return {
      task,
      label: '마감일 미지정',
      tone: 'border-line/60 bg-surface-2/60 text-text-dim',
    };
  }

  return null;
}

export default function WorkspaceDashboardPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const pageTitleCtx = usePageTitle();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pageTitleCtx?.setTitle('대시보드');
  }, [pageTitleCtx]);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);
    Promise.all([
      apiRequest<Task[]>(`/api/real/workspaces/${workspaceId}/tasks?page=1&size=100`),
      apiRequest<SprintSummary[]>(`/api/real/workspaces/${workspaceId}/sprints?page=0&size=100`),
    ])
      .then(([taskResult, sprintResult]) => {
        if (!taskResult.ok) {
          setError(getErrorMessage({ code: taskResult.code, message: taskResult.message, status: taskResult.status }));
          return;
        }

        const rawTasks = Array.isArray(taskResult.data) ? taskResult.data : [];
        const rawSprints = Array.isArray(sprintResult.data)
          ? sprintResult.data
          : ((sprintResult.data as unknown as { content?: SprintSummary[] } | undefined)?.content ?? []);

        const sprintEndDateMap = Object.fromEntries(
          rawSprints
            .filter((sprint) => sprint?.sprintId)
            .map((sprint) => [sprint.sprintId!, sprint.endDate ?? null]),
        ) as Record<string, string | null>;

        setTasks(
          rawTasks.map((task) => ({
            ...task,
            sprintEndDate: task.sprintId ? sprintEndDateMap[task.sprintId] ?? null : null,
          })),
        );
        setError(null);
      })
      .catch(() => {
        setError('대시보드를 불러오는 중 오류가 발생했습니다.');
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const myTasks = useMemo(() => {
    if (!user?.id) return [];
    return tasks.filter((task) => task.assignee?.id === user.id);
  }, [tasks, user?.id]);

  const statusCounts = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        count: myTasks.filter((task) => task.status === status).length,
      })),
    [myTasks],
  );

  const activeTasks = useMemo(
    () =>
      myTasks
        .filter((task) => task.status === 'IN_PROGRESS')
        .sort((a, b) => {
          const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        }),
    [myTasks],
  );

  const issueTasks = useMemo(
    () =>
      myTasks
        .map((task) => getIssue(task))
        .filter((item): item is IssueTask => Boolean(item)),
    [myTasks],
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line/40 bg-surface/95 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="m-0 text-[12px] uppercase tracking-[0.14em] text-text-dim">Workspace Dashboard</p>
            <h2 className="m-0 mt-2 text-[24px] font-semibold text-text">
              {authLoading ? '대시보드 로딩 중...' : `${user?.firstName ?? user?.email ?? '내'}의 태스크 현황`}
            </h2>
            <p className="m-0 mt-2 text-[14px] text-text-soft">
              현재 나에게 배정된 태스크 흐름과 대응이 필요한 이슈를 한 번에 봅니다.
            </p>
          </div>
          <Link
            href={`/workspaces/${workspaceId}/board?view=my`}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line/60 bg-surface-2/60 px-4 text-[13px] font-medium text-text transition-colors hover:border-accent/30 hover:text-accent-soft"
          >
            나의 태스크 보기
          </Link>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red/35 bg-red/10 px-4 py-3 text-[13px] text-red">
          {error}
        </section>
      ) : null}

      <section className="rounded-2xl border border-line/40 bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-[16px] font-semibold text-text">상태별 태스크 수</h3>
            <p className="m-0 mt-1 text-[13px] text-text-dim">내 태스크 기준으로 집계합니다.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {statusCounts.map((item) => (
            <div key={item.status} className="rounded-2xl border border-line/50 bg-surface-2/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <TaskStatusDot status={item.status} className="size-3" />
                <span className="text-[13px] font-medium text-text">{TASK_STATUS_LABELS[item.status]}</span>
              </div>
              <p className="m-0 mt-3 text-[24px] font-semibold text-text">{loading || authLoading ? '...' : item.count}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line/40 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-[16px] font-semibold text-text">지금 진행 중인 태스크</h3>
              <p className="m-0 mt-1 text-[13px] text-text-dim">우선 순서대로 확인할 작업입니다.</p>
            </div>
            <span className="text-[12px] text-text-dim">{activeTasks.length}개</span>
          </div>
          <div className="mt-4 space-y-3">
            {loading || authLoading ? (
              <div className="rounded-2xl border border-line/50 bg-surface-2/40 px-4 py-8 text-center text-[13px] text-text-dim">
                로딩 중...
              </div>
            ) : activeTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line/60 bg-surface-2/30 px-4 py-8 text-center text-[13px] text-text-dim">
                진행 중인 태스크가 없습니다.
              </div>
            ) : (
              activeTasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-2xl border border-line/50 bg-surface-2/30 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <TaskStatusDot status={task.status} className="mt-1 size-2.5" />
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[14px] font-medium text-text break-words">{task.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-dim">
                        <span>{getDisplayName(task)}</span>
                        <span>마감일 {formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-line/40 bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="m-0 text-[16px] font-semibold text-text">이슈가 있는 태스크</h3>
              <p className="m-0 mt-1 text-[13px] text-text-dim">대응이 필요한 태스크만 추려서 보여줍니다.</p>
            </div>
            <span className="text-[12px] text-text-dim">{issueTasks.length}개</span>
          </div>
          <div className="mt-4 space-y-3">
            {loading || authLoading ? (
              <div className="rounded-2xl border border-line/50 bg-surface-2/40 px-4 py-8 text-center text-[13px] text-text-dim">
                로딩 중...
              </div>
            ) : issueTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line/60 bg-surface-2/30 px-4 py-8 text-center text-[13px] text-text-dim">
                현재 감지된 이슈 태스크가 없습니다.
              </div>
            ) : (
              issueTasks.slice(0, 6).map((item) => (
                <div key={item.task.id} className="rounded-2xl border border-line/50 bg-surface-2/30 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-[14px] font-medium text-text break-words">{item.task.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-dim">
                        <span>상태 {TASK_STATUS_LABELS[item.task.status]}</span>
                        <span>마감일 {formatDate(item.task.dueDate)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${item.tone}`}>
                      {item.label}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
