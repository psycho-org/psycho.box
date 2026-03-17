'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, DatePicker, TaskStatusDot } from '@/components/ui';
import { TASK_STATUS_LABELS, type TaskStatus } from '@/lib/task-status';
import { apiRequest } from '@/lib/client';
import {
  applyWorkspaceMemberDisplayNamesToTask,
  fetchWorkspaceMemberDisplayNameMap,
  fetchWorkspaceMembers,
  type WorkspaceMemberDisplayNameMap,
  type WorkspaceMemberDisplaySource,
} from '@/lib/workspace-member-display';

/* ─── 타입 ─── */

interface TaskAssignee {
  id: string;
  name?: string;
  email?: string;
}

export interface TaskDetailModalTask {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: TaskAssignee | null;
  assignees?: TaskAssignee[];
  description?: string | null;
}

interface TaskDetailResponse {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  assignee?: TaskAssignee | null;
  assignees?: TaskAssignee[];
}

interface TaskDetailModalProps {
  open: boolean;
  onClose: () => void;
  task: TaskDetailModalTask | null;
  workspaceId: string;
  /** 이전/다음 탐색용 */
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  /** 수정 후 부모에 알림 */
  onUpdated?: () => void;
  workspaceMembers?: WorkspaceMemberDisplaySource[];
  memberDisplayNameMap?: WorkspaceMemberDisplayNameMap;
}

const STATUS_OPTIONS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'BACKLOG'];

/* ─── 유틸 ─── */

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

function colorFromId(id: string): string {
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

/* ─── 아이콘 ─── */

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

/* ─── 인라인 편집 헬퍼 ─── */

function EditableText({
  value,
  onSave,
  multiline = false,
  className = '',
  textClassName = '',
  placeholder = '',
}: {
  value: string;
  onSave: (v: string) => Promise<void> | void;
  multiline?: boolean;
  className?: string;
  textClassName?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  async function save() {
    const trimmed = draft.trim();
    if (trimmed === value.trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    const sharedCls = `w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 resize-none m-0 ${saving ? 'opacity-60' : ''} ${textClassName}`;
    return (
      <div className={`relative ${className}`}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            rows={1}
            className={`${sharedCls} overflow-hidden`}
            disabled={saving}
            placeholder={placeholder}
            onBlur={() => void save()}
            style={{
              height: inputRef.current ? `${inputRef.current.scrollHeight}px` : 'auto',
            }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); void save(); }
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            className={sharedCls}
            disabled={saving}
            placeholder={placeholder}
            onBlur={() => void save()}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={`group flex items-start gap-1.5 cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-surface-2/50 transition-colors ${className}`}
      onDoubleClick={() => setEditing(true)}
      title="더블클릭하여 수정"
    >
      <span className={`flex-1 min-w-0 ${textClassName}`}>
        {value || <span className="text-text-dim italic">{placeholder || '(없음)'}</span>}
      </span>
      <PencilIcon className="size-3.5 text-text-dim opacity-0 group-hover:opacity-60 shrink-0 mt-0.5 transition-opacity" />
    </div>
  );
}

/* ─── 메인 컴포넌트 ─── */

export function TaskDetailModal({
  open,
  onClose,
  task,
  workspaceId,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  onUpdated,
  workspaceMembers,
  memberDisplayNameMap,
}: TaskDetailModalProps) {
  const [detail, setDetail] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [members, setMembers] = useState<WorkspaceMemberDisplaySource[]>(workspaceMembers ?? []);
  const [hasChanges, setHasChanges] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);

  /* 데이터 패치 */
  const fetchTask = useCallback(() => {
    if (!task?.id || !workspaceId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiRequest<TaskDetailResponse>(`/api/real/workspaces/${workspaceId}/tasks/${task.id}`),
      memberDisplayNameMap
        ? Promise.resolve(memberDisplayNameMap)
        : fetchWorkspaceMemberDisplayNameMap(workspaceId),
    ])
      .then(([r, memberDisplayNameMap]) => {
        if (r.ok && r.data) {
          setDetail(applyWorkspaceMemberDisplayNamesToTask(r.data, memberDisplayNameMap));
        } else {
          setError(r.message ?? '불러오기 실패');
        }
      })
      .catch(() => setError('불러오기 실패'))
      .finally(() => setLoading(false));
  }, [task, workspaceId, memberDisplayNameMap]);

  const fetchMembers = useCallback(() => {
    if (workspaceMembers?.length) {
      setMembers(workspaceMembers);
      return;
    }
    if (!workspaceId || members.length > 0) return;
    fetchWorkspaceMembers(workspaceId)
      .then(setMembers)
      .catch(console.error);
  }, [workspaceId, members.length, workspaceMembers]);

  useEffect(() => {
    if (workspaceMembers?.length) {
      setMembers(workspaceMembers);
    }
  }, [workspaceMembers]);

  useEffect(() => {
    if (open && task?.id) {
      fetchTask();
      fetchMembers();
      setHasChanges(false);
    }
    if (!open) { setDetail(null); setError(null); setStatusOpen(false); setAssigneeOpen(false); }
  }, [open, task?.id, fetchTask, fetchMembers]);

  function handleClose() {
    if (hasChanges) {
      onUpdated?.();
    }
    onClose();
  }

  /* 키보드 좌우 탐색 */
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      // 에디팅 중일 때는 무시
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        if (hasChanges) onUpdated?.();
        onPrev?.();
      }
      if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        if (hasChanges) onUpdated?.();
        onNext?.();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, onPrev, onNext, hasPrev, hasNext, hasChanges, onUpdated]);

  /* 상태 드롭다운 바깥 클릭 닫기 */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (statusOpen && statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (assigneeOpen && assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setAssigneeOpen(false);
    }
    if (statusOpen || assigneeOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [statusOpen, assigneeOpen]);

  /* body 스크롤 잠금 */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  /* 수정 API (Optimistic Update) */
  async function patchField(field: keyof TaskDetailResponse, value: unknown) {
    if (!task?.id) return;
    
    // 이전 상태 백업
    const previousDetail = detail;
    const previousTask = task;
    
    // 낙관적 UI 업데이트
    if (detail) {
      setDetail({ ...detail, [field]: value } as TaskDetailResponse);
    }
    setHasChanges(true);

    const result = await apiRequest(
      `/api/real/workspaces/${workspaceId}/tasks/${task.id}`,
      { method: 'PATCH', body: JSON.stringify({ [field]: value }) },
    );
    
    if (result.ok) {
      // 서버 데이터로 최종 덮어쓰기
      if (result.data) {
        const nextMemberDisplayNameMap = memberDisplayNameMap ?? await fetchWorkspaceMemberDisplayNameMap(workspaceId);
        setDetail((prev) =>
          applyWorkspaceMemberDisplayNamesToTask(
            { ...prev, ...(result.data as TaskDetailResponse) } as TaskDetailResponse,
            nextMemberDisplayNameMap,
          ),
        );
      }
    } else {
      // 실패 시 롤백
      setDetail(previousDetail);
      setError('수정에 실패했습니다. 변경이 취소되었습니다.');
      // 경고 메세지 3초 후 제거
      setTimeout(() => setError(null), 3000);
    }
  }

  if (!open || !task) return null;

  const source = detail ?? task;
  const { displayTitle, tags } = parseTagsFromTitle(source.title);
  const people = source.assignees?.length ? source.assignees : source.assignee ? [source.assignee] : [];
  const dueDateRaw = source.dueDate ? source.dueDate.slice(0, 10) : '';
  const dueDateLabel = source.dueDate
    ? new Date(source.dueDate).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : '마감일 없음';
  const isDone = source.status === 'DONE' || source.status === 'CANCELLED';
  const isOverdue = !isDone && source.dueDate && new Date(source.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  const description = (detail?.description && detail.description !== '-') ? detail.description : '';

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* 좌측 화살표 */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChanges) onUpdated?.(); onPrev?.(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-[10000] p-2.5 rounded-full bg-surface/80 border border-line/60 text-text-dim hover:text-text hover:bg-surface-2 transition-colors shadow-lg backdrop-blur-sm"
          aria-label="이전 태스크"
        >
          <ChevronLeftIcon className="size-5" />
        </button>
      )}

      {/* 우측 화살표 */}
      {hasNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChanges) onUpdated?.(); onNext?.(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-[10000] p-2.5 rounded-full bg-surface/80 border border-line/60 text-text-dim hover:text-text hover:bg-surface-2 transition-colors shadow-lg backdrop-blur-sm"
          aria-label="다음 태스크"
        >
          <ChevronRightIcon className="size-5" />
        </button>
      )}

      {/* 모달 본체: 고정된 크기와 내부 스크롤 */}
      <div
        className="w-full max-w-[640px] h-[85vh] max-h-[850px] min-h-[500px] flex flex-col bg-surface border border-line rounded-[16px] shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0">
          <h2 className="m-0 text-[16px] font-semibold text-text">태스크 상세</h2>
          <button type="button" onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-3 text-text-dim hover:text-text transition-colors" aria-label="닫기">
            <XIcon className="size-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {/* 로딩 */}
          {loading && (
            <div className="flex items-center gap-2 text-text-dim text-[13px] mb-4">
              <span className="inline-block size-4 border-2 border-text-dim border-t-transparent rounded-full animate-spin" />
              불러오는 중...
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div className="rounded-lg py-2.5 px-3 bg-red/15 border border-red/35 mb-4" role="alert">
              <p className="m-0 text-[13px] text-red-400">{error}</p>
            </div>
          )}

          {/* 제목 (더블클릭 수정) */}
          <div className="mb-5">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">제목</span>
            <div className="mt-1">
              <EditableText
                value={source.title}
                onSave={(v) => patchField('title', v)}
                textClassName="text-lg font-semibold text-text break-all"
              />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 ml-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-surface-3 text-text-soft border border-line">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* 설명 (더블클릭 수정) */}
          <div className="mb-5">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">설명</span>
            <div className="mt-1">
              <EditableText
                value={description}
                onSave={(v) => patchField('description', v || '-')}
                multiline
                textClassName="text-[13px] text-text leading-relaxed whitespace-pre-wrap"
                placeholder="설명을 입력하세요"
              />
            </div>
          </div>

          {/* 상태 + 마감일 */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* 상태 (클릭하여 변경) */}
            <div>
              <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">상태</span>
              <div className="mt-1.5 relative" ref={statusRef}>
                <button
                  type="button"
                  onClick={() => setStatusOpen((o) => !o)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-2/50 transition-colors w-full text-left"
                >
                  <TaskStatusDot status={source.status} />
                  <span className="text-[14px] text-text font-medium">{TASK_STATUS_LABELS[source.status]}</span>
                  <svg className={`size-3.5 text-text-dim ml-auto transition-transform ${statusOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {statusOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 py-1 bg-surface-2 border border-line rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => { setStatusOpen(false); void patchField('status', s); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors ${source.status === s ? 'bg-accent-dim text-accent-soft' : 'hover:bg-surface-3 text-text'}`}
                      >
                        <TaskStatusDot status={s} />
                        {TASK_STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 마감일 (DatePicker) */}
            <div>
              <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">마감일</span>
              <div className="mt-1.5 min-w-[140px]">
                <DatePicker
                  mode="single"
                  value={dueDateRaw || null}
                  onChange={(v) => {
                    const dateStr = v as string | null;
                    void patchField('dueDate', dateStr ? `${dateStr}T23:59:59.000Z` : null);
                  }}
                  placeholder="마감일 선택"
                  popupPlacement="bottom-end"
                />
              </div>
            </div>
          </div>

          {/* 담당자 */}
          <div className="mb-2">
            <span className="text-[11px] font-medium text-text-dim uppercase tracking-wide">담당자</span>
            <div className="mt-1.5 relative" ref={assigneeRef}>
              <div 
                className="flex flex-wrap gap-2 cursor-pointer group"
                onClick={() => setAssigneeOpen((o) => !o)}
                role="button"
                tabIndex={0}
              >
                {people.length > 0 ? (
                  people.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-line/50 group-hover:border-accent/40 transition-colors">
                      <div
                        className="shrink-0 size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface shadow-sm"
                        style={{ backgroundColor: colorFromId(p.id) }}
                      >
                        {(p.name ?? p.email ?? '?').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[13px] text-text">{p.name || p.email || '이름 없음'}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 bg-surface-2 px-3 py-1.5 rounded-lg border border-dashed border-line/50 text-text-dim group-hover:border-accent/40 group-hover:text-text transition-colors">
                    <span className="text-[13px]">지정되지 않음 (클릭하여 추가)</span>
                  </div>
                )}
              </div>

              {/* 담당자 선택 드롭다운 */}
              {assigneeOpen && (
                <div className="absolute left-0 top-full mt-2 w-[240px] py-1 bg-surface-2 border border-line rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  <div className="px-3 py-2 border-b border-line/50">
                    <span className="text-[11px] font-medium text-text-dim">담당자 선택</span>
                  </div>
                  {/* 담당자 해제 버튼 */}
                  {people.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigneeOpen(false);
                        void patchField('assignees', []); // 1명 이상일 수 있으므로 빈 배열로 초기화
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-[13px] text-left text-red-400 hover:bg-surface-3 transition-colors"
                    >
                      <XIcon className="size-4" />
                      담당자 제거
                    </button>
                  )}
                  {members.map((m) => {
                    const isSelected = people.some((p) => p.id === m.accountId);
                    return (
                      <button
                        key={m.accountId}
                        type="button"
                        onClick={() => {
                          setAssigneeOpen(false);
                          // 단일 담당자로 교체한다고 가정 (API 상황에 맞게 조정)
                          void patchField('assignees', [{ id: m.accountId }]);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-[13px] text-left transition-colors ${
                          isSelected ? 'bg-accent-dim/50' : 'hover:bg-surface-3'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="shrink-0 size-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface shadow-sm"
                            style={{ backgroundColor: colorFromId(m.accountId) }}
                          >
                            {(m.name ?? '?').slice(0, 2).toUpperCase()}
                          </div>
                          <span className={`truncate ${isSelected ? 'font-medium text-accent' : 'text-text'}`}>
                            {m.name}
                          </span>
                        </div>
                        {isSelected && <CheckIcon className="size-4 text-accent" />}
                      </button>
                    );
                  })}
                  {members.length === 0 && (
                    <div className="px-3 py-3 text-center text-text-dim text-[12px]">멤버가 없습니다.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-surface shrink-0">
          <span className="text-[11px] text-text-dim">더블클릭하면 필드를 수정할 수 있습니다</span>
          <Button type="button" variant="secondary" onClick={handleClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
