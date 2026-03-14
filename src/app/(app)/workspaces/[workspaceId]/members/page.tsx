'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { AppShell } from '@/components/app-shell';
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

export default function MembersPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await apiRequest<Member[]>(`/api/real/workspaces/${workspaceId}/members`);

      if (!mounted) return;

      if (!result.ok) {
        setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
        return;
      }

      setMembers(result.data ?? []);
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName="워크스페이스"
      title="멤버 관리"
      subtitle="멤버 목록, 초대"
    >
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">멤버 목록</h3>

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

        <div className="mt-4 border border-dashed border-line rounded-lg p-4 text-center">
          <p className="m-0 text-text-dim text-[13px]">초대 폼: 이메일, 역할, 초대 보내기</p>
        </div>
      </section>
    </AppShell>
  );
}
