'use client';

import { useRef, useEffect, useState } from 'react';

export function colorFromId(id: string): string {
  const hue = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 55%, 45%)`;
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

function AssigneeAvatar({
  assignee,
  className,
}: {
  assignee?: { id: string; name: string } | null;
  className?: string;
}) {
  const initials = assignee?.name ? assignee.name.slice(0, 2).toUpperCase() : '?';
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

export interface AssigneeItem {
  id: string;
  name: string;
  count: number;
}

export type AssigneeFilterKey = string | 'none';

interface AssigneeSidebarProps {
  assigneeList: AssigneeItem[];
  noAssigneeCount: number;
  selectedAssignee: AssigneeFilterKey | null;
  collapsed: boolean;
  onSelect: (key: AssigneeFilterKey | null) => void;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AssigneeSidebar({
  assigneeList,
  noAssigneeCount,
  selectedAssignee,
  collapsed,
  onSelect,
  onCollapsedChange,
}: AssigneeSidebarProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const [toggleLeft, setToggleLeft] = useState<number | null>(null);
  const assigneeCount = assigneeList.length + (noAssigneeCount > 0 ? 1 : 0);

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
            : 'lg:w-56 rounded-2xl border border-line/40 bg-surface-2/30'
        }`}
      >
        {collapsed ? (
          <div className="h-full w-px rounded-full bg-line/60" />
        ) : (
          <>
            <div className="border-b border-line/50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 text-[14px] font-semibold text-text">담당자</h3>
                <span className="text-[12px] text-text-dim">{assigneeCount}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              <button
                type="button"
                onClick={() => onSelect(null)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] transition-colors ${
                  selectedAssignee === null ? 'bg-accent-dim text-accent-soft' : 'hover:bg-surface-2 text-text'
                }`}
              >
                <span className="text-text-dim tabular-nums shrink-0">전체</span>
                <span className="tabular-nums text-text-dim">({assigneeCount})</span>
              </button>
              {assigneeList.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onSelect(a.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] transition-colors ${
                    selectedAssignee === a.id ? 'bg-accent-dim text-accent-soft' : 'hover:bg-surface-2 text-text'
                  }`}
                >
                  <AssigneeAvatar assignee={{ id: a.id, name: a.name }} className="size-6" />
                  <span className="min-w-0 truncate flex-1">{a.name}</span>
                  <span className="tabular-nums text-text-dim shrink-0">{a.count}</span>
                </button>
              ))}
              {noAssigneeCount > 0 && (
                <button
                  type="button"
                  onClick={() => onSelect('none')}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-[13px] transition-colors ${
                    selectedAssignee === 'none' ? 'bg-accent-dim text-accent-soft' : 'hover:bg-surface-2 text-text'
                  }`}
                >
                  <AssigneeAvatar assignee={null} className="size-6" />
                  <span className="min-w-0 truncate flex-1">담당자 없음</span>
                  <span className="tabular-nums text-text-dim shrink-0">{noAssigneeCount}</span>
                </button>
              )}
            </div>
          </>
        )}
      </aside>

      {/* Mobile horizontal scroll */}
      <div className="lg:hidden rounded-2xl border border-line/40 bg-surface-2/30">
        <div className="border-b border-line/50 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 text-[14px] font-semibold text-text">담당자</h3>
            <span className="text-[12px] text-text-dim">{assigneeCount}</span>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors ${
              selectedAssignee === null
                ? 'border-accent/30 bg-accent-dim/30 text-accent-soft'
                : 'border-line/50 bg-surface text-text'
            }`}
          >
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-text-dim">전</span>
            <span className="text-[12px] font-medium">전체</span>
          </button>
          {assigneeList.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onSelect(a.id)}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors ${
                selectedAssignee === a.id
                  ? 'border-accent/30 bg-accent-dim/30 text-accent-soft'
                  : 'border-line/50 bg-surface text-text'
              }`}
            >
              <AssigneeAvatar assignee={{ id: a.id, name: a.name }} className="size-7" />
              <div className="min-w-0">
                <div className="max-w-[88px] truncate text-[12px] font-medium">{a.name}</div>
                <div className="text-[11px] text-text-dim">{a.count}</div>
              </div>
            </button>
          ))}
          {noAssigneeCount > 0 && (
            <button
              type="button"
              onClick={() => onSelect('none')}
              className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left transition-colors ${
                selectedAssignee === 'none'
                  ? 'border-accent/30 bg-accent-dim/30 text-accent-soft'
                  : 'border-line/50 bg-surface text-text'
              }`}
            >
              <AssigneeAvatar assignee={null} className="size-7" />
              <div className="min-w-0">
                <div className="max-w-[88px] truncate text-[12px] font-medium">담당자 없음</div>
                <div className="text-[11px] text-text-dim">{noAssigneeCount}</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 패널 접기/펼치기 토글 버튼 (데스크톱 전용 fixed) */}
      {toggleLeft !== null && (
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className="fixed top-[50svh] z-20 hidden -translate-x-1/2 -translate-y-1/2 group lg:flex h-28 w-2.5 items-center justify-center rounded-full border border-line/60 bg-surface/88 text-text-dim shadow-sm backdrop-blur transition-[width,background-color,border-color,color] duration-200 hover:w-3 hover:border-accent/40 hover:bg-surface-2 hover:text-text"
          style={{ left: toggleLeft }}
          aria-label={collapsed ? '담당자 패널 펼치기' : '담당자 패널 접기'}
        >
          <PanelToggleIcon className="size-3.5 group-hover:scale-110" collapsed={collapsed} />
        </button>
      )}
    </>
  );
}
