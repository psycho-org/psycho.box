'use client';

import { useState } from 'react';

export interface CollapsibleTableGroup<T> {
  key: string;
  label: string;
  count: number;
  items: T[];
  /** 그룹 헤더 왼쪽 액센트 색상 (hex) */
  accentColor?: string;
}

export interface CollapsibleTableListProps<T> {
  groups: CollapsibleTableGroup<T>[];
  columns: { key: string; label: string; render: (item: T) => React.ReactNode; width?: string }[];
  getItemId: (item: T) => string;
  emptyMessage?: string;
  defaultExpanded?: boolean;
  /** 행별 추가 className (예: 경고 테두리) */
  getItemRowClassName?: (item: T) => string;
  /** 행 클릭 이벤트 */
  onRowClick?: (item: T) => void;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`shrink-0 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function CollapsibleTableList<T>({
  groups,
  columns,
  getItemId,
  emptyMessage = '항목이 없습니다.',
  defaultExpanded = true,
  getItemRowClassName,
  onRowClick,
}: CollapsibleTableListProps<T>) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() =>
    new Set(defaultExpanded ? groups.map((g) => g.key) : []),
  );

  const toggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (groups.length === 0) {
    return (
      <p className="py-8 text-center text-text-dim text-[13px]">{emptyMessage}</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      {groups.map((group, idx) => {
        const isExpanded = expandedKeys.has(group.key);
        return (
          <div
            key={group.key}
            className={idx > 0 ? 'border-t border-line' : ''}
          >
            {/* 헤더: 액센트바 | chevron + label | count */}
            <button
              type="button"
              onClick={() => toggle(group.key)}
              className="w-full flex items-center gap-2.5 py-2.5 pl-3 pr-3 text-left hover:bg-surface-2/50 transition-colors"
            >
              {/* 액센트 바 2px */}
              <span
                className="shrink-0 w-0.5 h-4 rounded-full"
                style={{ backgroundColor: group.accentColor ?? 'transparent' }}
              />
              <span className="text-text-dim">
                <ChevronIcon expanded={isExpanded} />
              </span>
              <span className="flex-1 text-[13px] font-medium text-text truncate text-left">
                {group.label}
              </span>
              <span className="shrink-0 text-[12px] text-text-dim tabular-nums w-8 text-right">
                {group.count}
              </span>
            </button>

            {/* 테이블 */}
            {isExpanded && (
              <div className="border-t border-line">
                <div className="lg:hidden space-y-2 p-3">
                  {group.items.length === 0 ? (
                    <div className="rounded-xl border border-line/60 bg-surface px-3 py-6 text-center text-[12px] text-text-dim">
                      없음
                    </div>
                  ) : (
                    group.items.map((item) => (
                      <div
                        key={getItemId(item)}
                        className={`rounded-xl border border-line/60 bg-surface px-3 py-3 ${getItemRowClassName?.(item) ?? ''} ${onRowClick ? 'cursor-pointer transition-colors hover:bg-blue/5 focus:outline-none focus:bg-blue/10' : ''}`}
                        onClick={() => onRowClick?.(item)}
                        role={onRowClick ? 'button' : undefined}
                        tabIndex={onRowClick ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onRowClick(item);
                          }
                        }}
                      >
                        <div className="space-y-2.5">
                          {columns.map((col) => (
                            <div key={col.key} className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-3">
                              <span className="text-[11px] font-medium text-text-dim">{col.label}</span>
                              <div className="min-w-0 text-[13px] text-text">{col.render(item)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <table className="hidden w-full min-w-[360px] border-collapse table-fixed lg:table">
                  <colgroup>
                    {columns.map((col) => (
                      <col key={col.key} style={col.width ? { width: col.width } : undefined} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="border-b border-line text-left text-[11px] font-medium py-2 px-3 text-text-dim"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="py-6 px-3 text-center text-[12px] text-text-dim"
                        >
                          없음
                        </td>
                      </tr>
                    ) : (
                      group.items.map((item) => (
                        <tr
                          key={getItemId(item)}
                          className={`border-b border-line/60 last:border-b-0 hover:bg-surface-2/30 transition-colors ${getItemRowClassName?.(item) ?? ''} ${onRowClick ? 'cursor-pointer hover:bg-blue/5 focus:outline-none focus:bg-blue/10' : ''}`}
                          onClick={() => onRowClick?.(item)}
                          role={onRowClick ? 'button' : undefined}
                          tabIndex={onRowClick ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              onRowClick(item);
                            }
                          }}
                        >
                          {columns.map((col) => (
                            <td key={col.key} className="py-2 px-3 text-[13px] align-top overflow-hidden">
                              {col.render(item)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
