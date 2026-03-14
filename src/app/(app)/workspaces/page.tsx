'use client';

import Link from 'next/link';
import { AppShell } from '@/components/app-shell';

export default function WorkspacesPage() {
  return (
    <AppShell title="내 워크스페이스" subtitle="통계 카드, 워크스페이스 카드 목록">
      <section className="bg-surface border border-line rounded-xl p-3.5">
        <h3 className="m-0 mb-2.5 text-base">내 워크스페이스</h3>
        <p className="text-text-soft text-[13px] mb-3">
          API 연동 후 워크스페이스 목록이 표시됩니다.
        </p>
        <div className="grid gap-2.5 max-lg:grid-cols-1 md:grid-cols-3">
          <article className="bg-surface-2 border border-line rounded-[10px] p-3">
            <p className="m-0 text-xs text-text-dim">참여 워크스페이스</p>
            <strong className="block mt-1.5 text-2xl">0</strong>
          </article>
          <article className="bg-surface-2 border border-line rounded-[10px] p-3">
            <p className="m-0 text-xs text-text-dim">활성 프로젝트</p>
            <strong className="block mt-1.5 text-2xl">0</strong>
          </article>
          <article className="bg-surface-2 border border-line rounded-[10px] p-3">
            <p className="m-0 text-xs text-text-dim">완료된 태스크</p>
            <strong className="block mt-1.5 text-2xl">0</strong>
          </article>
        </div>
        <div className="mt-4 p-4 border border-dashed border-line rounded-xl text-center">
          <p className="m-0 text-text-dim text-[13px]">+ 새 워크스페이스 생성</p>
          <p className="m-0 mt-1 text-text-soft text-xs">API 연동 후 구현</p>
        </div>
      </section>
    </AppShell>
  );
}
