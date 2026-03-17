'use client';

import { use } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PageTitleProvider } from '@/components/page-title-context';

const VIEW_TITLES: Record<string, string> = {
  sprint: '태스크',
  assignee: '담당자',
  my: '나의 테스크',
  roadmap: '로드맵',
};

function getTitleFromPath(pathname: string, workspaceId: string, view: string | null): string {
  if (pathname === `/workspaces/${workspaceId}`) return '대시보드';
  if (pathname.endsWith('/sprint-board')) return '스프린트 보드';
  if (pathname.endsWith('/sprints')) return '스프린트';
  if (pathname.endsWith('/analysis')) return '분석';
  if (pathname.endsWith('/members')) return '멤버 관리';
  if (pathname.endsWith('/board')) {
    return VIEW_TITLES[view ?? 'sprint'] ?? '태스크';
  }
  return '보드';
}

export default function WorkspaceLayout({
  params,
  children,
}: {
  params: Promise<{ workspaceId: string }>;
  children: React.ReactNode;
}) {
  const { workspaceId } = use(params);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const initialTitle = getTitleFromPath(pathname ?? '', workspaceId, view);

  return (
    <PageTitleProvider initialTitle={initialTitle}>
      <AppShell workspaceId={workspaceId} workspaceName="워크스페이스">
        {children}
      </AppShell>
    </PageTitleProvider>
  );
}
