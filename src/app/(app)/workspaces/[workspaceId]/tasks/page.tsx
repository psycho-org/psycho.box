'use client';

import { use } from 'react';
import { AppShell } from '@/components/app-shell';

export default function TasksPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="태스크"
      subtitle="카드/리스트 뷰 전환, 백로그/로드맵/내 태스크 필터"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">모든 태스크</h3>
        <p className="text-text-soft text-[13px] mb-3">
          API 연동 후 태스크 목록이 표시됩니다.
        </p>
        <div className="flex gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            전체
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            내 태스크
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            백로그
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            로드맵
          </span>
          <span className="inline-flex items-center gap-1.5 border border-line bg-surface-2 text-text-soft rounded-full py-1.5 px-2.5 text-xs">
            완료됨
          </span>
        </div>
        <p className="text-text-dim text-xs">보기 타입: 카드형 / 리스트형 전환</p>
      </section>
    </AppShell>
  );
}
