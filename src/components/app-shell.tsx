'use client';

import Link from 'next/link';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';

interface AppShellProps {
  workspaceId: string;
  workspaceName: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function BoardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function AppShell({ workspaceId, workspaceName, title, subtitle, children }: AppShellProps) {
  const basePath = `/workspaces/${workspaceId}`;
  const navItems = [
    { href: `${basePath}/board`, label: '보드', icon: BoardIcon },
    { href: `${basePath}/tasks`, label: '태스크', icon: ListIcon },
    { href: `${basePath}/members`, label: '멤버', icon: UsersIcon },
  ];

  return (
    <div className="min-h-screen bg-bg flex">
      <aside className="w-56 shrink-0 border-r border-line bg-surface flex flex-col">
        <div className="p-2.5 border-b border-line">
          <WorkspaceSwitcher currentWorkspaceId={workspaceId} currentWorkspaceName={workspaceName} />
        </div>
        <nav className="p-2 flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-text-soft hover:bg-surface-2 hover:text-text transition-colors"
            >
              <Icon className="shrink-0 text-text-dim" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="shrink-0 border-b border-line bg-surface px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-lg font-semibold">{title}</h1>
            {subtitle ? <p className="m-0 mt-1 text-[13px] text-text-soft">{subtitle}</p> : null}
          </div>
          <Link
            href="/login"
            className="shrink-0 text-[13px] text-text-soft hover:text-text transition-colors"
          >
            로그인
          </Link>
        </header>
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
