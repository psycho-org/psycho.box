'use client';

import { useCallback, useEffect, useState } from 'react';
import { use } from 'react';
import { AppShell } from '@/components/app-shell';
import { AddMemberModal } from '@/components/add-member-modal';
import { Snackbar } from '@/components/ui/snackbar';
import { CardList } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

type WorkspaceMemberRole = 'OWNER' | 'CREW';
type ViewMode = 'list' | 'card';

interface Member {
  membershipId: string;
  accountId: string;
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

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
      <path d="M4 16h16" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function RoleBadge({ role, iconOnly = false, className = '' }: { role: WorkspaceMemberRole; iconOnly?: boolean; className?: string }) {
  const isOwner = role === 'OWNER';
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border shrink-0 ${
        iconOnly ? 'size-6 p-0' : 'gap-1 px-1.5 py-0.5 text-[11px] font-medium'
      } ${
        isOwner ? 'border-yellow/30 bg-yellow/10 text-[#ffd166]' : 'border-line bg-surface-2 text-text-dim'
      } ${className}`}
      title={isOwner ? '오너' : '멤버'}
    >
      {isOwner ? <CrownIcon className={iconOnly ? 'size-3.5' : 'size-3 shrink-0'} /> : <UserIcon className={iconOnly ? 'size-3.5' : 'size-3 shrink-0'} />}
      {!iconOnly && <span>{isOwner ? '오너' : '멤버'}</span>}
    </span>
  );
}

export default function MembersPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

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
    >
      <section className="bg-surface border border-line rounded-xl p-3.5 min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-2.5">
          <h3 className="m-0 text-base shrink-0">멤버 목록</h3>
          <div className="flex items-center gap-1">
            <div
              className="flex rounded-lg border border-line overflow-hidden"
              role="group"
              aria-label="보기 방식 선택"
            >
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`size-8 flex items-center justify-center transition-colors ${
                  viewMode === 'list' ? 'bg-surface-3 text-text' : 'bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text'
                }`}
                title="리스트 보기"
                aria-pressed={viewMode === 'list'}
              >
                <ListIcon className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`size-8 flex items-center justify-center border-l border-line transition-colors ${
                  viewMode === 'card' ? 'bg-surface-3 text-text' : 'bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text'
                }`}
                title="카드 보기"
                aria-pressed={viewMode === 'card'}
              >
                <GridIcon className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="size-8 shrink-0 rounded-lg bg-surface-2 flex items-center justify-center text-text-soft hover:bg-surface-3 hover:text-text transition-colors"
              title="멤버 추가"
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
        </div>

        {error ? (
          <p className="my-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/15 border border-red/35 text-red-400">
            {error}
          </p>
        ) : members.length === 0 ? (
          <p className="text-text-soft text-[13px] mb-3">멤버가 없습니다.</p>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto -mx-3.5 px-3.5">
          <table className="w-full min-w-[280px] table-fixed border-collapse">
            <thead>
              <tr>
                <th className="w-1/3 border-b border-line text-left text-[13px] py-2.5 px-2">이름</th>
                <th className="w-1/3 border-b border-line text-right text-[13px] py-2.5 px-2">역할</th>
                <th className="w-1/3 border-b border-line text-left text-[13px] py-2.5 px-2">가입일</th>
              </tr>
            </thead>
            <tbody>
              {[...members].sort((a, b) => (a.role === 'OWNER' && b.role !== 'OWNER' ? -1 : a.role !== 'OWNER' && b.role === 'OWNER' ? 1 : 0)).map((member) => (
                <tr key={member.membershipId} className="hover:bg-surface-2">
                  <td className="border-b border-line text-left text-[13px] py-2.5 px-2">
                    {member.name || '-'}
                  </td>
                  <td className="border-b border-line text-right text-[13px] py-2.5 px-2">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="border-b border-line text-left text-[13px] py-2.5 px-2">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="w-full min-w-0">
            <CardList
              items={[...members].sort((a, b) => (a.role === 'OWNER' && b.role !== 'OWNER' ? -1 : a.role !== 'OWNER' && b.role === 'OWNER' ? 1 : 0))}
              getItemId={(m) => m.membershipId}
              columns={3}
              emptyMessage="멤버가 없습니다."
              renderCard={(member) => (
              <div className="relative min-h-[4rem]">
                <span className="absolute top-0 right-0">
                  <RoleBadge role={member.role} iconOnly />
                </span>
                <p className="font-medium text-[14px] text-text m-0 truncate pr-8">{member.name || '-'}</p>
                <p className="text-[12px] text-text-dim m-0 mt-1">
                  {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            )}
            />
          </div>
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
