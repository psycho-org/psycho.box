'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { UserMenu } from '@/components/user-menu';
import { ViewModeToggle } from '@/components/ui';

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

interface AppShellProps {
  workspaceId: string;
  workspaceName: string;
  title: string;
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

function AnalysisIcon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function RoadmapIcon({ className }: { className?: string }) {
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
      <path d="M3 3v18h18" />
      <path d="M7 16v-4" />
      <path d="M12 16v-8" />
      <path d="M17 16V7" />
    </svg>
  );
}

function UserCheckIcon({ className }: { className?: string }) {
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
      <path d="m16 11 2 2 4-4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function AppShell({ workspaceId, workspaceName, title, children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const basePath = `/workspaces/${workspaceId}`;
  const boardView = searchParams.get('view') || 'sprint';
  const boardDisplay = searchParams.get('display') === 'list' ? 'list' : 'kanban';

  const isBoardPage = pathname === `${basePath}/board`;

  const closeMobile = () => setMobileMenuOpen(false);

  function setBoardDisplay(mode: 'list' | 'kanban') {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'kanban') params.delete('display');
    else params.set('display', 'list');
    router.push(`${basePath}/board?${params.toString()}`);
  }

  const boardNavItems = [
    { view: 'sprint', label: '스프린트', icon: BoardIcon },
    { view: 'assignee', label: '담당자', icon: PersonIcon },
    { view: 'my', label: '나의 테스크', icon: UserCheckIcon },
    { view: 'roadmap', label: '로드맵', icon: RoadmapIcon },
  ] as const;

  return (
    <div className="min-h-screen bg-bg flex">
      {/* 모바일: 오버레이 백드롭 */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바: 모바일에서 오버레이, 데스크톱에서 고정 */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-56 shrink-0 border-r border-line/80 bg-surface flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-14 px-2.5 border-b border-line flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <WorkspaceSwitcher currentWorkspaceId={workspaceId} currentWorkspaceName={workspaceName} />
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden shrink-0 size-8 flex items-center justify-center rounded-lg text-text-soft hover:bg-surface-2 hover:text-text"
            aria-label="메뉴 닫기"
          >
            <XIcon className="size-5" />
          </button>
        </div>
        <nav className="p-2.5 flex flex-col gap-0.5">
          {/* 스프린트, 담당자, 나의 테스크, 로드맵 */}
          {boardNavItems.map(({ view, label, icon: Icon }) => (
            <Link
              key={view}
              href={`${basePath}/board?view=${view}`}
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
                isBoardPage && boardView === view
                  ? 'bg-accent-dim/80 text-accent-soft'
                  : 'text-text-soft hover:bg-surface-2/80 hover:text-text'
              }`}
            >
              <Icon className="shrink-0 text-text-dim" />
              {label}
            </Link>
          ))}

          {/* 보드 페이지일 때 리스트/칸반 토글 */}
          {isBoardPage && (
            <div className="mt-3 pt-3 border-t border-line/60">
              <p className="text-[11px] font-medium text-text-dim uppercase tracking-wider mb-2 px-1">보기</p>
              <ViewModeToggle value={boardDisplay} onChange={setBoardDisplay} />
            </div>
          )}

          {/* Analysis */}
          <Link
            href={`${basePath}/analysis`}
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              pathname === `${basePath}/analysis`
                ? 'bg-accent-dim/80 text-accent-soft'
                : 'text-text-soft hover:bg-surface-2/80 hover:text-text'
            }`}
          >
            <AnalysisIcon className="shrink-0 text-text-dim" />
            분석
          </Link>

          {/* Members */}
          <Link
            href={`${basePath}/members`}
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
              pathname === `${basePath}/members`
                ? 'bg-accent-dim/80 text-accent-soft'
                : 'text-text-soft hover:bg-surface-2/80 hover:text-text'
            }`}
          >
            <UsersIcon className="shrink-0 text-text-dim" />
            멤버
          </Link>
        </nav>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="shrink-0 h-14 border-b border-line/80 bg-surface px-4 lg:px-6 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden shrink-0 size-9 -ml-1 flex items-center justify-center rounded-lg text-text-soft hover:bg-surface-2 hover:text-text"
              aria-label="메뉴 열기"
            >
              <MenuIcon className="size-5" />
            </button>
            <div className="min-w-0 flex items-center">
              <h1 className="m-0 text-base lg:text-lg font-semibold truncate leading-none">{title}</h1>
            </div>
          </div>
          <UserMenu />
        </header>
        <div className="flex-1 p-4 lg:p-6 overflow-auto min-w-0">{children}</div>
      </main>
    </div>
  );
}
