'use client';

import { useRef, useEffect, useState } from 'react';

interface Sprint {
  sprintId: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
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

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
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

function formatCompactDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
}

interface SprintSidebarProps {
  sprints: Sprint[];
  selectedSprintId: string | null;
  loading: boolean;
  error: string | null;
  collapsed: boolean;
  updatingSprint: boolean;
  deletingSprintId: string | null;
  onSelectSprint: (sprintId: string) => void;
  onCreateSprint: () => void;
  onEditSprint: (sprintId: string) => void;
  onDeleteSprint: (sprint: Sprint) => void;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function SprintSidebar({
  sprints,
  selectedSprintId,
  loading,
  error,
  collapsed,
  updatingSprint,
  deletingSprintId,
  onSelectSprint,
  onCreateSprint,
  onEditSprint,
  onDeleteSprint,
  onCollapsedChange,
}: SprintSidebarProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [toggleLeft, setToggleLeft] = useState<number | null>(null);

  useEffect(() => {
    function update() {
      const rect = panelRef.current?.getBoundingClientRect();
      setToggleLeft(rect ? rect.right : null);
    }
    update();
    const el = panelRef.current;
    const ro = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el!);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [collapsed]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        ref={panelRef}
        className={`hidden overflow-hidden transition-all duration-200 lg:flex lg:flex-col ${
          collapsed
            ? 'lg:w-4 lg:items-center lg:justify-center bg-transparent border-transparent shadow-none'
            : 'lg:w-72 bg-surface border border-line/40 rounded-2xl shadow-sm'
        }`}
      >
        {collapsed ? (
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
                  onClick={onCreateSprint}
                  className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface-2/70 hover:text-accent-soft"
                  aria-label="스프린트 추가"
                  title="스프린트 추가"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-1">
              {loading ? (
                <p className="text-text-soft text-[13px] px-2 py-2">로딩 중...</p>
              ) : error && sprints.length === 0 ? (
                <p className="text-red text-[13px] px-2 py-2">{error}</p>
              ) : sprints.length === 0 ? (
                <p className="text-text-soft text-[13px] px-2 py-2">스프린트가 없습니다.</p>
              ) : (
                sprints.map((sprint) => (
                  <div key={sprint.sprintId} className="group shrink-0 w-[240px] lg:w-auto">
                    <div
                      className={`rounded-xl transition-colors ${
                        selectedSprintId === sprint.sprintId
                          ? 'bg-accent-dim/80 text-accent-soft border border-accent/20'
                          : 'text-text hover:bg-surface-2 border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectSprint(sprint.sprintId)}
                        className="w-full min-w-0 text-left px-3 pt-3 pb-2"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[14px]">{sprint.name}</div>
                          <div className="mt-2 text-[12px] opacity-70">
                            <span className="truncate">
                              {formatCompactDate(sprint.startDate)} ~ {formatCompactDate(sprint.endDate)}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center justify-end gap-1 px-3 pb-2.5">
                        <button
                          type="button"
                          onClick={() => onEditSprint(sprint.sprintId)}
                          disabled={updatingSprint}
                          className={`inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-all hover:bg-surface/70 hover:text-text disabled:cursor-not-allowed disabled:opacity-50 ${
                            selectedSprintId === sprint.sprintId
                              ? 'opacity-100'
                              : 'opacity-100 lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100'
                          }`}
                          aria-label="스프린트 수정"
                          title="스프린트 수정"
                        >
                          <EditIcon className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSprint(sprint)}
                          disabled={deletingSprintId === sprint.sprintId}
                          className={`inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-all hover:bg-surface/70 hover:text-red disabled:cursor-not-allowed disabled:opacity-50 ${
                            selectedSprintId === sprint.sprintId
                              ? 'opacity-100'
                              : 'opacity-100 lg:pointer-events-none lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100'
                          }`}
                          aria-label="스프린트 삭제"
                          title="스프린트 삭제"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </aside>

      {/* Mobile horizontal scroll */}
      <section className="rounded-2xl border border-line/40 bg-surface shadow-sm lg:hidden">
        <div className="flex items-start justify-between gap-3 border-b border-line/50 px-4 py-3">
          <div className="min-w-0">
            <p className="m-0 text-[11px] uppercase tracking-[0.12em] text-text-dim">스프린트</p>
            <p className="m-0 mt-1 truncate text-[14px] font-medium text-text">
              {sprints.find((s) => s.sprintId === selectedSprintId)?.name ?? '스프린트를 선택하세요'}
            </p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            {selectedSprintId ? (
              <button
                type="button"
                onClick={() => onEditSprint(selectedSprintId)}
                className="inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface-2/70 hover:text-text"
                aria-label="스프린트 수정"
                title="스프린트 수정"
              >
                <EditIcon className="size-4" />
              </button>
            ) : null}
            {selectedSprintId ? (
              <button
                type="button"
                onClick={() => {
                  const sprint = sprints.find((s) => s.sprintId === selectedSprintId);
                  if (sprint) onDeleteSprint(sprint);
                }}
                className="inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface-2/70 hover:text-red"
                aria-label="스프린트 삭제"
                title="스프린트 삭제"
              >
                <TrashIcon className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCreateSprint}
              className="inline-flex size-8 items-center justify-center rounded-lg text-text-dim transition-colors hover:bg-surface-2/70 hover:text-accent-soft"
              aria-label="스프린트 추가"
              title="스프린트 추가"
            >
              <PlusIcon className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          {sprints.map((sprint) => (
            <button
              key={sprint.sprintId}
              type="button"
              onClick={() => onSelectSprint(sprint.sprintId)}
              className={`flex w-[176px] shrink-0 flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition-colors ${
                selectedSprintId === sprint.sprintId
                  ? 'border-accent/30 bg-accent-dim/30 text-accent-soft'
                  : 'border-line/50 bg-surface-2/30 text-text'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <SprintIcon className="size-4 shrink-0" />
                <span className="text-[11px] text-text-dim">{formatCompactDate(sprint.endDate)}</span>
              </div>
              <div className="w-full">
                <div className="truncate text-[13px] font-medium">{sprint.name}</div>
                <div className="mt-1 text-[11px] text-text-dim">
                  {formatCompactDate(sprint.startDate)} ~ {formatCompactDate(sprint.endDate)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Panel toggle button (desktop fixed) */}
      {toggleLeft !== null && (
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="fixed top-[50svh] z-20 hidden -translate-x-1/2 -translate-y-1/2 group lg:flex h-28 w-2.5 items-center justify-center rounded-full border border-line/60 bg-surface/88 text-text-dim shadow-sm backdrop-blur transition-[width,background-color,border-color,color] duration-200 hover:w-3 hover:border-accent/40 hover:bg-surface-2 hover:text-text"
          style={{ left: toggleLeft }}
          aria-label={collapsed ? '스프린트 패널 펼치기' : '스프린트 패널 접기'}
          title={collapsed ? '스프린트 패널 펼치기' : '스프린트 패널 접기'}
        >
          <PanelToggleIcon className="size-3.5 group-hover:scale-110" collapsed={collapsed} />
        </button>
      )}
    </>
  );
}
