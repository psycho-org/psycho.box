'use client';

import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/client';
import { CreateWorkspaceModal } from '@/components/create-workspace-modal';
import { getErrorMessage } from '@/lib/error-messages';

interface Workspace {
  id: string;
  name: string;
}

// API 응답: { id, title, role }
function toWorkspace(item: { id: string; title?: string; name?: string }): Workspace {
  return {
    id: item.id,
    name: item.title ?? item.name ?? '워크스페이스',
  };
}

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
  currentWorkspaceName?: string;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export function WorkspaceSwitcher({ currentWorkspaceId, currentWorkspaceName }: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedWorkspaceName, setFetchedWorkspaceName] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentWorkspaceId) {
      setFetchedWorkspaceName(null);
      return;
    }
    setFetchedWorkspaceName(null);
    apiRequest<{ id?: string; name?: string; title?: string }>(
      `/api/real/workspaces/${currentWorkspaceId}`,
    ).then((result) => {
      if (result.ok && result.data) {
        const name = result.data.name ?? result.data.title ?? null;
        setFetchedWorkspaceName(name);
      }
    });
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    apiRequest<{ id: string; title?: string; name?: string }[]>('/api/real/workspaces')
      .then((result) => {
        if (!result.ok) {
          setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
          return;
        }
        const raw = result.data;
        setWorkspaces(Array.isArray(raw) ? raw.map((item) => toWorkspace(item)) : []);
      })
      .catch(() => setError(getErrorMessage({ status: 500 })))
      .finally(() => setLoading(false));
  }, [open]);

  const displayName =
    fetchedWorkspaceName ?? currentWorkspaceName ?? (currentWorkspaceId ? '로딩 중...' : '워크스페이스 선택');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-2 text-left transition-colors"
      >
        <div className="size-8 shrink-0 rounded-lg bg-gradient-to-br from-accent to-[#f06aaf] grid place-items-center text-[11px] font-bold">
          {(fetchedWorkspaceName ?? currentWorkspaceName)
            ? (fetchedWorkspaceName ?? currentWorkspaceName)!.slice(0, 2).toUpperCase()
            : 'PB'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="m-0 text-[13px] font-semibold truncate">{displayName}</p>
        </div>
        <ChevronDownIcon
          className={`shrink-0 text-text-dim transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 py-1.5 bg-surface-2 border border-line rounded-[10px] shadow-lg z-50 min-w-[220px] max-w-full overflow-hidden">
          <Link
            href="/workspaces"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-text-soft hover:bg-surface-3 hover:text-text transition-colors"
          >
            <GearIcon className="shrink-0 text-text-dim" />
            <span>내 워크스페이스</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setCreateModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-text-soft hover:bg-surface-3 hover:text-text transition-colors text-left"
          >
            <PlusIcon className="shrink-0 text-text-dim" />
            <span>새 워크스페이스 만들기</span>
          </button>
          <div className="h-px bg-line my-1" />
          {loading ? (
            <div className="px-3 py-4 text-center text-[13px] text-text-dim">로딩 중...</div>
          ) : error ? (
            <div className="px-3 py-4 text-center text-[13px] text-red">{error}</div>
          ) : (
            workspaces.map((ws) => {
              const isActive = ws.id === currentWorkspaceId;
              return (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}/board`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors min-w-0 ${
                    isActive ? 'bg-accent-dim text-accent-soft' : 'text-text-soft hover:bg-surface-3 hover:text-text'
                  }`}
                >
                  <div className="size-6 shrink-0 rounded-md bg-gradient-to-br from-accent to-[#f06aaf] grid place-items-center text-[10px] font-bold">
                    {ws.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="min-w-0 truncate">{ws.name}</span>
                </Link>
              );
            })
          )}
        </div>
      )}

      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
