'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { CreateWorkspaceModal } from '@/components/create-workspace-modal';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

interface Workspace {
  id: string;
  name: string;
}

function toWorkspace(item: { id: string; title?: string; name?: string }): Workspace {
  return {
    id: item.id,
    name: item.title ?? item.name ?? '워크스페이스',
  };
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  function loadWorkspaces() {
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
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-56 shrink-0 border-r border-line bg-surface flex flex-col">
        <div className="p-2.5 border-b border-line">
          <WorkspaceSwitcher />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="shrink-0 border-b border-line bg-surface px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-lg font-semibold">내 워크스페이스</h1>
            <p className="m-0 mt-1 text-[13px] text-text-soft">워크스페이스 목록</p>
          </div>
          <Link
            href="/login"
            className="shrink-0 text-[13px] text-text-soft hover:text-text transition-colors"
          >
            로그인
          </Link>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <section className="bg-surface border border-line rounded-xl p-3.5">
            <div className="flex items-center justify-between gap-2.5 mb-2.5">
              <h3 className="m-0 text-base">워크스페이스 목록</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="size-8 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center text-text-soft hover:bg-surface-3 hover:text-text transition-colors"
                title="새 워크스페이스"
              >
                <PlusIcon className="size-4" />
              </button>
            </div>

            {error ? (
              <p className="my-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/15 border border-red/35 text-red-400">
                {error}
              </p>
            ) : loading ? (
              <p className="text-text-soft text-[13px] py-4">로딩 중...</p>
            ) : workspaces.length === 0 ? (
              <p className="text-text-soft text-[13px] py-4">워크스페이스가 없습니다. 새로 만들어 보세요.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspaces/${ws.id}/board`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-line bg-surface-2 hover:bg-surface-3 hover:border-line-2 transition-colors"
                  >
                    <div className="size-10 shrink-0 rounded-lg bg-gradient-to-br from-accent to-[#f06aaf] grid place-items-center text-sm font-bold">
                      {ws.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium truncate">{ws.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadWorkspaces}
      />
    </div>
  );
}
