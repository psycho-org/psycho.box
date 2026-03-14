'use client';

import { use } from 'react';
import { AppShell } from '@/components/app-shell';

export default function BoardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="DevTeam"
      title="스프린트 보드"
      subtitle="Kanban (할일/진행중/검토중/완료)"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">Kanban Board</h3>
        <p className="text-text-soft text-[13px]">
          API 연동 후 Kanban 컬럼과 태스크 카드가 표시됩니다.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2.5 max-lg:grid-cols-1">
          {['할일', '진행중', '검토중', '완료'].map((col) => (
            <div key={col} className="border border-line rounded-[10px] bg-surface-2 p-2.5 min-h-[180px]">
              <h4 className="m-0 mb-2.5 text-xs uppercase tracking-[0.05em] text-text-soft">{col}</h4>
              <p className="m-0 text-text-dim text-xs">컬럼 하단: + 태스크 추가</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
