'use client';

import { useCallback, useState } from 'react';

export interface ListTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface ListTableProps<T> {
  columns: ListTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  emptyMessage?: string;
  page?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export function ListTable<T>({
  columns,
  data,
  getRowId,
  onRowClick,
  onSort,
  sortKey,
  sortDirection = 'asc',
  emptyMessage = '데이터가 없습니다.',
  page = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
}: ListTableProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState<string | null>(null);
  const [internalSortDir, setInternalSortDir] = useState<'asc' | 'desc'>('asc');

  const activeSortKey = sortKey ?? internalSortKey;
  const activeSortDir = sortDirection ?? internalSortDir;

  const handleSort = useCallback(
    (key: string) => {
      const col = columns.find((c) => c.key === key);
      if (!col?.sortable) return;

      const nextDir = activeSortKey === key && activeSortDir === 'asc' ? 'desc' : 'asc';
      if (onSort) {
        onSort(key, nextDir);
      } else {
        setInternalSortKey(key);
        setInternalSortDir(nextDir);
      }
    },
    [columns, activeSortKey, activeSortDir, onSort],
  );

  const totalPages = totalCount != null && pageSize > 0 ? Math.ceil(totalCount / pageSize) : 1;
  const hasPagination = totalCount != null && totalCount > pageSize;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`border-b border-line text-left text-[13px] py-2.5 px-2 ${col.className ?? ''}`}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-accent-soft"
                  >
                    {col.label}
                    {activeSortKey === col.key && (
                      <span className="text-[10px]">{activeSortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="border-b border-line py-8 px-2 text-center text-text-soft text-[13px]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={getRowId(row)}
                className={`border-b border-line ${onRowClick ? 'cursor-pointer hover:bg-surface-2' : ''}`}
                onClick={() => onRowClick?.(row, idx)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-2.5 px-2 text-[13px] ${col.className ?? ''}`}>
                    {col.render ? col.render(row) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {hasPagination && onPageChange && (
        <div className="flex items-center justify-between gap-2 mt-3 px-2">
          <span className="text-text-dim text-xs">
            {totalCount}개 중 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="border border-line rounded px-2 py-1 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-2"
            >
              이전
            </button>
            <span className="py-1 px-2 text-[13px] text-text-soft">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="border border-line rounded px-2 py-1 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-2"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
