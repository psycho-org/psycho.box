'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
  workspaceId?: string;
  workspaceName?: string;
  title?: string;
  subtitle?: string;
}

const tabs = [
  { key: 'workspaces', label: '워크스페이스', href: '/workspaces' },
  { key: 'board', label: '스프린트 보드', href: '/board' },
  { key: 'tasks', label: '태스크', href: '/tasks' },
  { key: 'members', label: '멤버 관리', href: '/members' },
];

export function AppShell({ children, workspaceId, workspaceName, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const base = workspaceId ? `/workspaces/${workspaceId}` : '/workspaces';

  return (
    <div className="h-screen grid grid-cols-[240px_1fr] max-lg:grid-cols-1 max-lg:grid-rows-[auto_1fr]">
      <aside className="bg-surface border-r border-line flex flex-col max-lg:border-r-0 max-lg:border-b max-lg:border-line">
        <div className="h-[64px] shrink-0 flex items-center px-5 border-b border-line">
          <Link href="/workspaces" className="text-2xl tracking-[-0.02em] font-bold">
            Psycho<span className="text-accent-soft">.Box</span>
          </Link>
        </div>

        {workspaceId && workspaceName ? (
          <div className="m-3 p-2.5 bg-surface-2 border border-line rounded-[10px]">
            <div className="size-7 rounded-lg bg-gradient-to-br from-accent to-[#f06aaf] grid place-items-center text-[11px] font-bold mb-2">
              {workspaceName.slice(0, 2).toUpperCase()}
            </div>
            <p className="m-0 text-[13px] font-semibold truncate">{workspaceName}</p>
            <p className="m-0 text-[11px] text-text-dim">워크스페이스</p>
          </div>
        ) : null}

        <nav className="py-2 px-3 flex-1">
          <p className="m-0 mb-1.5 text-[10px] tracking-[0.08em] uppercase text-text-dim px-2">메인</p>
          {workspaceId
            ? tabs.slice(1).map((tab) => {
                const href = `${base}${tab.href}`;
                const active = pathname === href;
                return (
                  <Link
                    key={tab.key}
                    className={`block mb-0.5 py-2 px-2.5 rounded-lg text-[13px] ${
                      active ? 'bg-accent-dim text-accent-soft' : 'text-text-soft hover:bg-surface-2 hover:text-text'
                    }`}
                    href={href}
                  >
                    {tab.label}
                  </Link>
                );
              })
            : (
              <Link
                className="block mb-0.5 py-2 px-2.5 rounded-lg text-[13px] bg-accent-dim text-accent-soft"
                href="/workspaces"
              >
                워크스페이스
              </Link>
            )}
        </nav>

        <div className="border-t border-line p-3">
          <Link className="block py-2 px-2.5 rounded-lg text-text-soft text-[13px] hover:bg-surface-2 hover:text-text" href="/workspaces">
            워크스페이스 목록
          </Link>
        </div>
      </aside>

      <main className="grid grid-rows-[64px_1fr] min-w-0 overflow-auto">
        <header className="h-[64px] shrink-0 border-b border-line bg-surface flex items-center justify-between gap-3 px-5">
          <div className="text-[13px] text-text-soft flex gap-1.5">
            {workspaceName ? (
              <>
                <span>{workspaceName}</span>
                <span>/</span>
              </>
            ) : null}
            <span className="text-text font-semibold">{title ?? 'Psycho.Box'}</span>
          </div>
          {subtitle ? <p className="m-0 text-text-dim text-xs truncate">{subtitle}</p> : null}
        </header>
        <section className="overflow-auto p-[18px] grid gap-3.5 bg-gradient-to-b from-[#10131a] to-bg">
          {children}
        </section>
      </main>
    </div>
  );
}
