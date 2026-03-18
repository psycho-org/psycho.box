'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button, DatePicker, Select, TaskStatusDot } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';
import { TASK_STATUS_LABELS, type TaskStatus } from '@/lib/task-status';
import { fetchWorkspaceMembers, type WorkspaceMemberDisplaySource } from '@/lib/workspace-member-display';

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'BACKLOG'];

interface TaskCreateModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  projectId?: string | null;
  minDate?: string;
  maxDate?: string;
  /** 해당 칸반 컬럼의 status (생성 시 이 상태로 매핑) */
  defaultStatus: TaskStatus;
  onSuccess?: () => void;
}

export function TaskCreateModal({
  open,
  onClose,
  workspaceId,
  projectId = null,
  minDate,
  maxDate,
  defaultStatus,
  onSuccess,
}: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [members, setMembers] = useState<WorkspaceMemberDisplaySource[]>([]);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setStatusOpen(false);
  }, [open]);

  useEffect(() => {
    if (!statusOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [statusOpen]);

  useEffect(() => {
    if (open) setStatus(defaultStatus);
  }, [open, defaultStatus]);

  useEffect(() => {
    if (!open || !workspaceId) return;

    let cancelled = false;
    setMembersLoading(true);

    fetchWorkspaceMembers(workspaceId)
      .then((nextMembers) => {
        if (cancelled) return;
        setMembers(nextMembers);
      })
      .catch(() => {
        if (cancelled) return;
        setMembers([]);
      })
      .finally(() => {
        if (cancelled) return;
        setMembersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, workspaceId]);

  function handleClose() {
    if (!loading) {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setAssigneeId('');
      setDueDate('');
      setError('');
      onClose();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const createBody: Record<string, unknown> = {
      title: trimmedTitle,
      description: description.trim() || '-',
    };
    if (assigneeId.trim()) createBody.assigneeId = assigneeId.trim();
    if (dueDate) createBody.dueDate = `${dueDate}T23:59:59.000Z`;

    const createResult = await apiRequest<{ id: string }>(
      projectId
        ? `/api/real/workspaces/${workspaceId}/projects/${projectId}/tasks`
        : `/api/real/workspaces/${workspaceId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(createBody),
      },
    );

    if (!createResult.ok) {
      setLoading(false);
      setError(getErrorMessage({ code: createResult.code, message: createResult.message, status: createResult.status }));
      return;
    }

    const taskId = createResult.data?.id;
    if (taskId && status !== 'TODO') {
      const patchResult = await apiRequest(
        `/api/real/workspaces/${workspaceId}/tasks/${taskId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      );
      if (!patchResult.ok) {
        setLoading(false);
        setError(getErrorMessage({ code: patchResult.code, message: patchResult.message, status: patchResult.status }));
        return;
      }
    }

    setLoading(false);
    handleClose();
    onSuccess?.();
  }

  return (
    <Dialog open={open} onClose={handleClose} title={projectId ? '프로젝트 태스크 추가' : '태스크 추가'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="task-title" className="block text-[13px] font-medium text-text-soft mb-1.5">
            제목 <span className="text-red">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError('');
            }}
            placeholder="태스크 제목"
            className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={loading}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="task-description" className="block text-[13px] font-medium text-text-soft mb-1.5">
            설명
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명 (선택)"
            rows={3}
            className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>
        <div ref={statusRef}>
          <label className="block text-[13px] font-medium text-text-soft mb-1.5">
            상태
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !loading && setStatusOpen((o) => !o)}
              disabled={loading}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] text-left hover:border-line-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <TaskStatusDot status={status} />
                {TASK_STATUS_LABELS[status]}
              </span>
              <svg
                className={`size-4 text-text-dim transition-transform ${statusOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {statusOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 py-1 bg-surface-2 border border-line rounded-lg shadow-lg z-50 max-h-48 overflow-hidden overflow-y-auto">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatus(s);
                      setStatusOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left transition-colors ${
                      status === s ? 'bg-accent-dim text-accent-soft' : 'hover:bg-surface-3 text-text'
                    }`}
                  >
                    <TaskStatusDot status={s} />
                    {TASK_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="task-assignee" className="block text-[13px] font-medium text-text-soft mb-1.5">
            담당자
          </label>
          <Select
            id="task-assignee"
            value={assigneeId}
            onChange={setAssigneeId}
            disabled={loading || membersLoading}
            options={[
              { value: '', label: membersLoading ? '멤버 불러오는 중...' : '담당자 없음' },
              ...members.map((member) => ({
                value: member.accountId,
                label: `${member.name}${member.role ? ` (${member.role})` : ''}`,
              })),
            ]}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-text-soft mb-1.5">
            업무 종료일
          </label>
          <DatePicker
            mode="single"
            value={dueDate || null}
            onChange={(v) => setDueDate(v ? (v as string) : '')}
            minDate={minDate}
            maxDate={maxDate}
            placeholder="날짜 선택"
            disabled={loading}
          />
        </div>
        {error && (
          <div className="rounded-lg py-2.5 px-3 bg-red/15 border border-red/35" role="alert">
            <p className="m-0 text-[13px] text-red-400">{error}</p>
          </div>
        )}
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button type="submit" loading={loading} disabled={!title.trim()}>
            저장
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
