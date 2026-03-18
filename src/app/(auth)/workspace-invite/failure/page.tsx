import { WorkspaceInviteResultCard } from '@/components/workspace-invite-result-card';

export default function WorkspaceInviteFailurePage() {
  return (
    <WorkspaceInviteResultCard
      title="워크스페이스 초대 수락 실패"
      descriptionLines={[
        '이메일 인증에 실패했거나 초대 링크가 만료되었을 수 있습니다.',
        '다시 초대를 받은 뒤 로그인해서 확인해 주세요.',
      ]}
      detailLines={[
        '링크가 만료되었거나 이미 처리된 초대일 수 있습니다.',
        '다시 초대 링크를 받은 뒤 로그인해서 재시도해 주세요.',
      ]}
      tone="failure"
    />
  );
}
