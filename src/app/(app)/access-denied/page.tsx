'use client';

import Link from 'next/link';
import { AuthCard } from '@/components/auth-card';

export default function AccessDeniedPage() {
  return (
    <AuthCard title="접근 권한 없음">
      <div className="grid gap-3">
        <p className="m-0 text-text-soft text-[13px]">
          탈퇴했거나 삭제된 워크스페이스일 수 있습니다.
          워크스페이스 소유자에게 문의하거나 다른 워크스페이스를 선택해 주세요.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Link
            className="border border-transparent rounded-lg cursor-pointer font-[inherit] bg-accent text-white py-2.5 px-3.5 hover:bg-accent-soft"
            href="/workspaces"
          >
            워크스페이스 목록으로
          </Link>
          <Link
            className="border border-line rounded-lg cursor-pointer font-[inherit] bg-surface-2 text-text-soft py-2.5 px-3.5 hover:border-line-2 hover:text-text"
            href="/login"
          >
            다시 로그인
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
