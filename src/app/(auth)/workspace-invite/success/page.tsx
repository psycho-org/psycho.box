import { WorkspaceInviteResultCard } from '@/components/workspace-invite-result-card';

export default function WorkspaceInviteSuccessPage() {
  return (
    <WorkspaceInviteResultCard
      title="워크스페이스 초대 수락 완료"
      descriptionLines={[
        '이메일 인증이 완료되어 워크스페이스 초대가 정상적으로 처리되었습니다.',
        '로그인 후 참여된 워크스페이스를 확인해 주세요.',
      ]}
      detailLines={[
        '초대 링크 인증은 끝났습니다.',
        '로그인 후 참여된 워크스페이스에서 바로 작업을 이어갈 수 있습니다.',
      ]}
      tone="success"
    />
  );
}
