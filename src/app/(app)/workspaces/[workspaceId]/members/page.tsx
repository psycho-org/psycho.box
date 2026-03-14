'use client';

import { useCallback, useEffect, useState } from 'react';
import { use } from 'react';
import { AppShell } from '@/components/app-shell';
import { AddMemberModal } from '@/components/add-member-modal';
import { Snackbar } from '@/components/ui/snackbar';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

type WorkspaceMemberRole = 'OWNER' | 'CREW';

interface Member {
  accountId: string;
  email: string;
  name: string;
  role: WorkspaceMemberRole;
  joinedAt: string | null;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function MembersPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const loadMembers = useCallback(() => {
    void apiRequest<Member[]>(`/api/real/workspaces/${workspaceId}/members`).then((result) => {
      if (result.ok) {
        setMembers(result.data ?? []);
        setError(null);
      } else {
        setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      }
    });
  }, [workspaceId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="멤버 관리"
      subtitle="멤버 목록, 초대"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <div className="flex items-center justify-between gap-2.5 mb-2.5">
          <h3 className="m-0 text-base">멤버 목록</h3>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="size-8 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center text-text-soft hover:bg-surface-3 hover:text-text transition-colors"
            title="멤버 추가"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>

        {error ? (
          <p className="my-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/15 border border-red/35 text-red-400">
            {error}
          </p>
        ) : members.length === 0 ? (
          <p className="text-text-soft text-[13px] mb-3">멤버가 없습니다.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-line text-left text-[13px] py-2.5 px-2">이름</th>
                <th className="border-b border-line text-left text-[13px] py-2.5 px-2">이메일</th>
                <th className="border-b border-line text-left text-[13px] py-2.5 px-2">역할</th>
                <th className="border-b border-line text-left text-[13px] py-2.5 px-2">가입일</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.accountId} className="hover:bg-surface-2">
                  <td className="border-b border-line text-left text-[13px] py-2.5 px-2">
                    {member.name || '-'}
                  </td>
                  <td className="border-b border-line text-left text-[13px] py-2.5 px-2">
                    {member.email}
                  </td>
                  <td className="border-b border-line text-left text-[13px] py-2.5 px-2">
                    {member.role === 'OWNER' ? '오너' : '멤버'}
                  </td>
                  <td className="border-b border-line text-left text-[13px] py-2.5 px-2">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </section>

      <AddMemberModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={() => {
          loadMembers();
          setSnackbarOpen(true);
        }}
      />

      <Snackbar
        open={snackbarOpen}
        message="초대 메일이 발송되었습니다."
        onClose={() => setSnackbarOpen(false)}
      />
    </AppShell>
  );
}
