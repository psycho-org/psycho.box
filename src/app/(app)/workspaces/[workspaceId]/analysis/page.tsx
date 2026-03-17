'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

interface AnalysisRequest {
  analysisRequestId: string;
  status?: string;
  createdAt?: string;
}

interface Sprint {
  sprintId: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface AnalysisReport {
  id: string;
  sprintId: string;
  title: string;
  status: string;
  createdAt: string;
  summary: string;
  content: string | null;
}

function formatCompactDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}.${month}.${day}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusLabel(status?: string) {
  if (!status) return '대기';
  if (status === 'COMPLETED') return '완료';
  if (status === 'FAILED') return '실패';
  if (status === 'RUNNING') return '분석 중';
  return '대기';
}

function getStatusTone(status?: string) {
  if (status === 'COMPLETED') return 'border-green/30 bg-green/10 text-green';
  if (status === 'FAILED') return 'border-red/30 bg-red/10 text-red';
  if (status === 'RUNNING') return 'border-accent/30 bg-accent-dim/40 text-accent-soft';
  return 'border-line/60 bg-surface-2/60 text-text-dim';
}

function getStatusCountLabel(status: string) {
  if (status === 'COMPLETED') return '완료';
  if (status === 'FAILED') return '실패';
  if (status === 'RUNNING') return '진행 중';
  return '대기';
}

function buildPendingReport(sprint: Sprint | undefined, request: AnalysisRequest): AnalysisReport {
  const createdAt = request.createdAt ?? new Date().toISOString();
  const status = request.status ?? 'PENDING';
  return {
    id: request.analysisRequestId ?? `${sprint?.sprintId ?? 'report'}-${createdAt}`,
    sprintId: sprint?.sprintId ?? '',
    title: sprint ? `${sprint.name} 분석 리포트` : '분석 리포트',
    status,
    createdAt,
    summary:
      status === 'FAILED'
        ? '리포트 생성에 실패했습니다. 다시 요청해 주세요.'
        : status === 'COMPLETED'
          ? '분석이 완료되었습니다. 결과 조회 API 연결 시 본문이 표시됩니다.'
          : '분석 요청이 접수되었습니다. 완료되면 본문이 여기에 표시됩니다.',
    content:
      status === 'COMPLETED'
        ? '분석 결과 조회 API가 연결되면 이 영역에 리포트 본문 텍스트가 표시됩니다.'
        : null,
  };
}

function SelectChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const pageTitleCtx = usePageTitle();
  const [sprintId, setSprintId] = useState('');
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [sprintsLoading, setSprintsLoading] = useState(true);
  const [reportsBySprint, setReportsBySprint] = useState<Record<string, AnalysisReport[]>>({});
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    pageTitleCtx?.setTitle('분석');
  }, [pageTitleCtx]);

  useEffect(() => {
    if (!workspaceId) return;

    setSprintsLoading(true);
    apiRequest<{ data: Sprint[] }>(`/api/real/workspaces/${workspaceId}/sprints?page=0&size=100`)
      .then((result) => {
        if (!result.ok) {
          setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
          return;
        }

        const sprintList = Array.isArray(result.data) ? result.data : (result.data as any)?.content || [];
        setSprints(sprintList);
        setSprintId((prev) => prev || sprintList[0]?.sprintId || '');
      })
      .catch(() => {
        setError('스프린트 목록을 불러오는 중 오류가 발생했습니다.');
      })
      .finally(() => setSprintsLoading(false));
  }, [workspaceId]);

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => sprint.sprintId === sprintId) ?? null,
    [sprints, sprintId],
  );

  const reports = useMemo(() => reportsBySprint[sprintId] ?? [], [reportsBySprint, sprintId]);

  useEffect(() => {
    if (reports.length === 0) {
      setSelectedReportId(null);
      return;
    }

    const hasSelectedReport = reports.some((report) => report.id === selectedReportId);
    if (!hasSelectedReport) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const reportStatusSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of reports) {
      counts.set(report.status, (counts.get(report.status) ?? 0) + 1);
    }
    return ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']
      .map((status) => ({
        status,
        count: counts.get(status) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }, [reports]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = sprintId.trim();
    if (!trimmed) {
      setError('스프린트를 선택해 주세요.');
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
      const request = result.data as unknown as AnalysisRequest;
      const nextReport = buildPendingReport(
        sprints.find((sprint) => sprint.sprintId === trimmed),
        request,
      );
      setReportsBySprint((prev) => ({
        ...prev,
        [trimmed]: [nextReport, ...(prev[trimmed] ?? [])],
      }));
      setSelectedReportId(nextReport.id);
      setSuccess(`분석 요청이 생성되었습니다. (ID: ${request.analysisRequestId ?? '—'})`);
    } else {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line/40 bg-surface/90 p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-[540px]">
            <label htmlFor="sprintId" className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-text-dim">
              스프린트
            </label>
            <div className="relative">
              <select
                id="sprintId"
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-line/50 bg-surface-2/50 px-4 py-3 pr-12 text-[20px] font-semibold text-text focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={loading || sprintsLoading || sprints.length === 0}
              >
                {sprints.length === 0 ? (
                  <option value="">{sprintsLoading ? '스프린트 불러오는 중...' : '선택 가능한 스프린트가 없습니다.'}</option>
                ) : (
                  sprints.map((sprint) => (
                    <option key={sprint.sprintId} value={sprint.sprintId}>
                      {sprint.name}
                    </option>
                  ))
                )}
              </select>
              <SelectChevronIcon className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-text-dim" />
            </div>
            <p className="mb-0 mt-2 text-[12px] text-text-dim">
              {selectedSprint
                ? `${formatCompactDate(selectedSprint.startDate)} ~ ${formatCompactDate(selectedSprint.endDate)}`
                : sprintsLoading
                  ? '스프린트 목록을 불러오는 중입니다.'
                  : '선택 가능한 스프린트가 없습니다.'}
            </p>
          </div>
          <Button type="submit" loading={loading} disabled={loading || sprintsLoading || !sprintId}>
            분석 요청
          </Button>
        </form>
        {error ? <p className="mt-4 text-[13px] text-red">{error}</p> : null}
        {success ? <p className="mt-4 text-[13px] text-green">{success}</p> : null}
      </section>

      <section className="rounded-2xl border border-line/40 bg-surface/90 p-6 shadow-sm">
        <div className="mb-4">
          <div>
            <h2 className="m-0 text-base font-semibold">분석 결과</h2>
            <p className="mt-1 mb-0 text-[13px] text-text-dim">
              요청된 리포트를 최신순으로 확인하고, 우측 본문에서 상세 내용을 읽을 수 있습니다.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-line/50 bg-surface-2/30">
            <div className="border-b border-line/50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 text-[14px] font-semibold text-text">리포트 목록</h3>
                <span className="text-[12px] text-text-dim">{reports.length}개</span>
              </div>
              {reportStatusSummary.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {reportStatusSummary.map((item) => (
                    <span
                      key={item.status}
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(item.status)}`}
                    >
                      {getStatusCountLabel(item.status)} {item.count}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {!selectedSprint ? (
                <div className="rounded-xl border border-dashed border-line/60 bg-surface px-4 py-8 text-center text-[13px] text-text-dim">
                  스프린트를 선택하면 리포트 목록이 표시됩니다.
                </div>
              ) : reports.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line/60 bg-surface px-4 py-8 text-center text-[13px] text-text-dim">
                  아직 생성된 분석 리포트가 없습니다.
                </div>
              ) : (
                reports.map((report) => {
                  const isSelected = selectedReportId === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportId(report.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'border-accent/30 bg-accent-dim/30 shadow-sm ring-1 ring-accent/10'
                          : 'border-line/50 bg-surface hover:border-line/80 hover:bg-surface-2/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-text">{report.title}</div>
                          <div className="mt-1 text-[12px] text-text-dim">{formatDateTime(report.createdAt)}</div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusTone(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                      <p className="mt-3 mb-0 line-clamp-2 text-[12px] leading-5 text-text-dim">{report.summary}</p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="min-h-[420px] overflow-hidden rounded-2xl border border-line/50 bg-surface">
            {!selectedSprint ? (
              <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-[14px] text-text-dim">
                왼쪽에서 스프린트를 선택하세요.
              </div>
            ) : !selectedReport ? (
              <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-[14px] text-text-dim">
                리포트를 선택하면 본문이 표시됩니다.
              </div>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col">
                    <div className="border-b border-line/50 px-6 py-5">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="m-0 text-[12px] uppercase tracking-[0.12em] text-text-dim">리포트</p>
                          <h3 className="mt-2 mb-0 text-[22px] font-semibold text-text">{selectedReport.title}</h3>
                          <p className="mt-2 mb-0 text-[13px] text-text-dim">
                            {selectedSprint.name} · {formatCompactDate(selectedSprint.startDate)} ~{' '}
                        {formatCompactDate(selectedSprint.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(selectedReport.status)}`}
                      >
                        {getStatusLabel(selectedReport.status)}
                      </span>
                      <span className="text-[12px] text-text-dim">{formatDateTime(selectedReport.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {selectedReport.status === 'FAILED' ? (
                    <div className="max-w-3xl rounded-2xl border border-red/30 bg-red/10 px-5 py-4 text-[13px] text-red">
                      분석 리포트 생성이 실패했습니다. 같은 스프린트로 다시 요청하거나 백엔드 오류 로그를 확인해 주세요.
                    </div>
                  ) : selectedReport.status === 'RUNNING' || selectedReport.status === 'PENDING' ? (
                    <div className="max-w-3xl rounded-2xl border border-line/50 bg-surface-2/50 px-5 py-5">
                      <p className="m-0 text-[15px] font-medium text-text">
                        {selectedReport.status === 'RUNNING' ? '분석이 진행 중입니다.' : '분석 요청이 접수되었습니다.'}
                      </p>
                      <p className="mt-2 mb-0 text-[13px] leading-6 text-text-dim">
                        완료되면 이 영역에 본문이 표시됩니다. 현재는 리포트 목록에서 상태 변화를 확인할 수 있습니다.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line/60 bg-surface px-3 py-1.5 text-[12px] text-text-dim">
                        <span>요청 시각</span>
                        <span className="text-text">{formatDateTime(selectedReport.createdAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-line/50 bg-surface-2/30 px-5 py-5">
                      <pre className="m-0 max-w-3xl whitespace-pre-wrap break-words font-sans text-[14px] leading-7 text-text">
                        {selectedReport.content || '분석 본문이 없습니다.'}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
