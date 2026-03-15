'use client';

import { use, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { ViewModeToggle } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

interface AnalysisRequest {
  analysisRequestId: string;
  status?: string;
  createdAt?: string;
}

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [sprintId, setSprintId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resultDisplay, setResultDisplay] = useState<'list' | 'kanban'>('list');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = sprintId.trim();
    if (!trimmed) {
      setError('스프린트 ID를 입력해 주세요.');
      return;
    }

    setLoading(true);
    const result = await apiRequest<AnalysisRequest>(
      `/api/real/workspaces/${workspaceId}/analysis/request`,
      {
        method: 'POST',
        body: JSON.stringify({ target: { sprintId: trimmed } }),
      },
    );
    setLoading(false);

    if (result.ok && result.data) {
      const req = result.data as unknown as AnalysisRequest;
      setSuccess(`분석 요청이 생성되었습니다. (ID: ${req.analysisRequestId ?? '—'})`);
      setSprintId('');
    } else {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
    }
  }

  return (
    <AppShell
      workspaceId={workspaceId}
      workspaceName=""
      title="분석"
    >
      <div className="max-w-2xl space-y-6">
        <section className="rounded-2xl border border-line/40 bg-surface/90 p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-4">스프린트 분석 요청</h2>
          <p className="text-[13px] text-text-soft mb-4">
            스프린트 ID를 입력하면 AI 분석을 요청합니다. 결과는 API 준비 후 표시됩니다.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="sprintId" className="block text-[13px] font-medium mb-1.5">
                스프린트 ID
              </label>
              <input
                id="sprintId"
                type="text"
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                placeholder="예: 550e8400-e29b-41d4-a716-446655440000"
                className="w-full px-3 py-2.5 rounded-lg border border-line bg-bg text-[13px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                disabled={loading}
              />
            </div>
            <Button type="submit" loading={loading} disabled={loading}>
              분석 요청
            </Button>
          </form>
          {error && (
            <p className="mt-4 text-[13px] text-red">{error}</p>
          )}
          {success && (
            <p className="mt-4 text-[13px] text-green">{success}</p>
          )}
        </section>

        <section className="rounded-2xl border border-line/40 bg-surface/90 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-base font-semibold m-0">분석 결과</h2>
            <ViewModeToggle value={resultDisplay} onChange={setResultDisplay} />
          </div>
          <p className="text-[13px] text-text-dim">
            분석 요청 목록 및 결과 조회 API는 준비 중입니다.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
