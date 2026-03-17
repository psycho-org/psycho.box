'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { WorkspaceSwitcher } from '@/components/workspace-switcher';
import { UserMenu } from '@/components/user-menu';
import { ViewModeToggle, BoardViewToggle } from '@/components/ui';
import { ThemeToggleFloating } from '@/components/theme-toggle-floating';
import { VIEW_TOGGLE_PAGES } from '@/lib/view-toggle-config';
import { usePageTitle } from '@/components/page-title-context';
import { useAuth } from '@/components/auth-provider';
import { apiRequest } from '@/lib/client';

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
  title?: string;
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
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}

function SprintBoardIcon({ className }: { className?: string }) {
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
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="8" height="10" rx="1" />
      <rect x="13" y="10" width="8" height="4" rx="1" />
      <rect x="13" y="16" width="8" height="4" rx="1" />
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

export function AppShell({ workspaceId, workspaceName, title: titleProp, children }: AppShellProps) {
  const { setUser: setAuthUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    apiRequest<{ user?: { id: string; email?: string; firstName?: string; lastName?: string } }>('/api/real/auth/me').then(
      (result) => {
        if (result.ok && result.data?.user) setAuthUser(result.data.user);
      },
    );
  }, [setAuthUser]);
  const pageTitleCtx = usePageTitle();
  const title = pageTitleCtx?.title ?? titleProp ?? '보드';
  const searchParams = useSearchParams();
  const router = useRouter();
  const basePath = `/workspaces/${workspaceId}`;
  const boardView = searchParams.get('view') || 'sprint';

  const closeMobile = () => setMobileMenuOpen(false);

  const isBoardPage = pathname === `${basePath}/board`;

  /** 현재 경로에 맞는 뷰 토글 설정 (config 기반) */
  const viewToggleConfig = VIEW_TOGGLE_PAGES.find((c) => pathname.endsWith(c.pathEndsWith));

  function setViewDisplay(mode: 'list' | 'kanban') {
    if (!viewToggleConfig) return;
    const params = new URLSearchParams(searchParams.toString());
    const value = mode === 'list' ? viewToggleConfig.listParamValue : viewToggleConfig.cardParamValue;
    if (value) params.set('display', value);
    else params.delete('display');
    router.push(`${pathname}?${params.toString()}`);
  }

  function setBoardViewDisplay(mode: 'list' | 'kanban' | 'card') {
    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'list') params.set('display', 'list');
    else if (mode === 'card') params.set('display', 'card');
    else params.delete('display');
    router.push(`${pathname}?${params.toString()}`);
  }

  const boardDisplay = searchParams.get('display');
  const boardViewDisplay = boardDisplay === 'list' ? 'list' : boardDisplay === 'card' ? 'card' : 'kanban';

  const boardNavItems = [
    { view: 'sprint', label: '태스크', icon: BoardIcon },
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
        <nav className="p-2.5 flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto">
          {/* 스프린트, 담당자, 나의 테스크, 로드맵 */}
          {boardNavItems.map(({ view, label, icon: Icon }) => (
            <Link
              key={view}
              href={`${basePath}/board?view=${view}`}
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
                isBoardPage && boardView === view
                  ? 'bg-accent-dim/80 text-accent-soft'
                  : 'text-text-soft hover:bg-surface-2/80 hover:text-text'
              }`}
            >
              <Icon className="shrink-0 text-text-dim" />
              {label}
            </Link>
          ))}

          {/* Sprints Viewer (List) */}
          <Link
            href={`${basePath}/sprint-board`}
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
              pathname === `${basePath}/sprint-board`
                ? 'bg-accent-dim/80 text-accent-soft'
                : 'text-text-soft hover:bg-surface-2/80 hover:text-text'
            }`}
          >
            <SprintBoardIcon className="shrink-0 text-text-dim" />
            스프린트 보드
          </Link>

          <Link
            href={`${basePath}/sprints`}
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
              pathname === `${basePath}/sprints`
                ? 'bg-accent-dim/80 text-accent-soft'
                : 'text-text-soft hover:bg-surface-2/80 hover:text-text'
            }`}
          >
            <ListIcon className="shrink-0 text-text-dim" />
            스프린트
          </Link>

          {/* Analysis */}
          <Link
            href={`${basePath}/analysis`}
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
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
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-200 ${
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

      {/* 좌측 하단 플로팅: 리스트/칸반/카드 전환 + 테마 전환 */}
      <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2">
        {isBoardPage ? (
          <div className="shrink-0 shadow-lg rounded-full">
            <BoardViewToggle
              value={boardViewDisplay}
              onChange={setBoardViewDisplay}
              kanbanLabel="칸반"
              cardLabel="카드"
            />
          </div>
        ) : viewToggleConfig ? (
          <div className="shrink-0 shadow-lg rounded-full">
            <ViewModeToggle
              value={viewToggleConfig.getValue(searchParams.get('display'))}
              onChange={setViewDisplay}
              kanbanLabel={viewToggleConfig.kanbanLabel}
            />
          </div>
        ) : null}
        <ThemeToggleFloating />
      </div>

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
        <div className="flex-1 p-4 lg:p-6 overflow-auto min-w-0 bg-surface">{children}</div>
      </main>
    </div>
  );
}
