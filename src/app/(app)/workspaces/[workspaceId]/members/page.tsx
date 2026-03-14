'use client';

import { use } from 'react';
import { AppShell } from '@/components/app-shell';

export default function MembersPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="멤버 관리"
      subtitle="멤버 목록, 초대"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">멤버 목록</h3>
        <p className="text-text-soft text-[13px] mb-3">
          API 연동 후 멤버 목록이 표시됩니다. (GET /workspaces/{workspaceId}/members)
        </p>
        <div className="border border-dashed border-line rounded-lg p-4 text-center">
          <p className="m-0 text-text-dim text-[13px]">초대 폼: 이메일, 역할, 초대 보내기</p>
          <p className="m-0 mt-2 text-text-dim text-xs">멤버 목록: 아바타, 이름, 이메일, 역할(오너/멤버)</p>
        </div>
      </section>
    </AppShell>
  );
}
