'use client';

import { use, useEffect, useMemo, useState } from 'react';
import { usePageTitle } from '@/components/page-title-context';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

const MAX_DAILY_REQUESTS = 3;

interface AnalysisCreateResponse {
  analysisRequestId: string;
  status?: string;
  createdAt?: string;
}

interface AnalysisRequestListItem {
  analysisRequestId: string;
  status: string;
  hasReport: boolean;
  requestedAt: string;
}

interface AnalysisRequestListResponse {
  items: AnalysisRequestListItem[];
}

interface AnalysisReportResponse {
  workspaceId: string;
  sprintId: string;
  analysisRequestId: string;
  status: string;
  totalScore: number;
  result: string | null;
  createdAt: string | null;
}

interface Sprint {
  sprintId: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface AnalysisReportCard {
  id: string;
  analysisRequestId: string;
  sprintId: string;
  title: string;
  status: string;
  requestedAt: string;
  createdAt: string | null;
  summary: string;
  content: string | null;
  totalScore: number;
  hasReport: boolean;
  reportLoaded: boolean;
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
  if (status === 'DONE') return '완료';
  if (status === 'FAILED') return '실패';
  if (status === 'RUNNING') return '분석 중';
  if (status === 'QUEUED') return '대기';
  return '대기';
}

function getStatusTone(status?: string) {
  if (status === 'DONE') return 'border-green/30 bg-green/10 text-green';
  if (status === 'FAILED') return 'border-red/30 bg-red/10 text-red';
  if (status === 'RUNNING') return 'border-accent/30 bg-accent-dim/40 text-accent-soft';
  return 'border-line/60 bg-surface-2/60 text-text-dim';
}

function getStatusCountLabel(status: string) {
  if (status === 'DONE') return '완료';
  if (status === 'FAILED') return '실패';
  if (status === 'RUNNING') return '진행 중';
  return '대기';
}

function getReportTitle(sprint: Sprint | undefined) {
  return sprint ? `${sprint.name} 분석 리포트` : '분석 리포트';
}

function getReportSummary(status?: string, result?: string | null) {
  if (status === 'FAILED') {
    return '리포트 생성에 실패했습니다. 다시 요청해 주세요.';
  }
  if (status === 'DONE') {
    return result?.trim() || '리포트가 생성되었지만 본문이 비어 있습니다.';
  }
  if (status === 'RUNNING') {
    return '분석이 진행 중입니다. 잠시 후 새로고침해 주세요.';
  }
  return '분석 요청이 접수되었습니다. 잠시 후 새로고침해 주세요.';
}

function getListSummary(report: AnalysisReportCard) {
  if (report.status === 'FAILED') {
    return '리포트 생성 실패';
  }
  if (report.status === 'DONE') {
    return report.reportLoaded
      ? '리포트 생성 완료. 우측 상세 영역에서 내용을 확인하세요.'
      : '리포트 생성 완료. 내용을 불러오는 중입니다.';
  }
  if (report.status === 'RUNNING') {
    return '리포트 생성 진행 중';
  }
  return '리포트 생성 대기 중';
}

function formatRequestId(value: string) {
  return value.length > 8 ? value.slice(0, 8) : value;
}

function buildPendingCard(sprint: Sprint | undefined, request: AnalysisRequestListItem): AnalysisReportCard {
  return {
    id: request.analysisRequestId,
    analysisRequestId: request.analysisRequestId,
    sprintId: sprint?.sprintId ?? '',
    title: getReportTitle(sprint),
    status: request.status,
    requestedAt: request.requestedAt,
    createdAt: null,
    summary: getReportSummary(request.status),
    content: null,
    totalScore: 0,
    hasReport: request.hasReport,
    reportLoaded: false,
  };
}

function applyReportToCard(card: AnalysisReportCard, detail: AnalysisReportResponse): AnalysisReportCard {
  return {
    ...card,
    status: detail.status,
    createdAt: detail.createdAt,
    summary: getReportSummary(detail.status, detail.result),
    content: detail.result ?? null,
    totalScore: detail.totalScore,
    hasReport: true,
    reportLoaded: true,
  };
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
  const [reportsBySprint, setReportsBySprint] = useState<Record<string, AnalysisReportCard[]>>({});
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
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

        const sprintList = Array.isArray(result.data)
          ? result.data
          : ((result.data as { content?: Sprint[] } | undefined)?.content ?? []);

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

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedReportId) ?? null,
    [reports, selectedReportId],
  );

  const reportStatusSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of reports) {
      counts.set(report.status, (counts.get(report.status) ?? 0) + 1);
    }
    return ['QUEUED', 'RUNNING', 'DONE', 'FAILED']
      .map((status) => ({
        status,
        count: counts.get(status) ?? 0,
      }))
      .filter((item) => item.count > 0);
  }, [reports]);

  const todayRequestCount = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startTime = startOfToday.getTime();

    return reports.filter((report) => {
      const requestedTime = new Date(report.requestedAt).getTime();
      return Number.isFinite(requestedTime) && requestedTime >= startTime;
    }).length;
  }, [reports]);

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

  useEffect(() => {
    if (!workspaceId || !sprintId) return;

    let cancelled = false;
    setRequestsLoading(true);

    apiRequest<AnalysisRequestListResponse>(
      `/api/real/workspaces/${workspaceId}/analysis/requests?sprintId=${encodeURIComponent(sprintId)}`,
    )
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
          return;
        }

        const items = result.data?.items ?? [];
        const sprint = sprints.find((item) => item.sprintId === sprintId);

        setReportsBySprint((prev) => {
          const previousCards = prev[sprintId] ?? [];
          const previousById = new Map(previousCards.map((card) => [card.analysisRequestId, card]));
          const nextCards = items.map((item) => {
            const existing = previousById.get(item.analysisRequestId);
            const base = buildPendingCard(sprint, item);
            if (!existing) return base;
            return {
              ...base,
              createdAt: existing.createdAt,
              summary: existing.reportLoaded ? existing.summary : base.summary,
              content: existing.reportLoaded ? existing.content : base.content,
              totalScore: existing.reportLoaded ? existing.totalScore : base.totalScore,
              reportLoaded: existing.reportLoaded,
            };
          });

          return {
            ...prev,
            [sprintId]: nextCards,
          };
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError('분석 요청 목록을 불러오는 중 오류가 발생했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setRequestsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, sprintId, sprints]);

  useEffect(() => {
    if (!workspaceId || !selectedSprint || !selectedReport) return;
    if (!selectedReport.hasReport || selectedReport.reportLoaded) return;

    let cancelled = false;
    setDetailLoadingId(selectedReport.analysisRequestId);
    setDetailError(null);

    apiRequest<AnalysisReportResponse>(
      `/api/real/workspaces/${workspaceId}/analysis/requests/${selectedReport.analysisRequestId}/report`,
    )
      .then((result) => {
        if (cancelled) return;
        if (!result.ok || !result.data) {
          setDetailError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
          return;
        }

        const detail = result.data;
        setReportsBySprint((prev) => {
          const currentCards = prev[selectedSprint.sprintId] ?? [];
          return {
            ...prev,
            [selectedSprint.sprintId]: currentCards.map((card) =>
              card.analysisRequestId === selectedReport.analysisRequestId
                ? applyReportToCard(card, detail)
                : card,
            ),
          };
        });
      })
      .catch(() => {
        if (!cancelled) {
          setDetailError('리포트 상세를 불러오는 중 오류가 발생했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDetailLoadingId(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedReport, selectedSprint, workspaceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmed = sprintId.trim();
    if (!trimmed) {
      setError('스프린트를 선택해 주세요.');
      return;
    }
    if (todayRequestCount >= MAX_DAILY_REQUESTS) {
      setError('하루에 이 스프린트에 대해 최대 3회까지만 분석 요청할 수 있습니다.');
      return;
    }

    setLoading(true);
    const result = await apiRequest<AnalysisCreateResponse>(
      `/api/real/workspaces/${workspaceId}/analysis/request`,
      {
        method: 'POST',
        body: JSON.stringify({ sprintId: trimmed }),
      },
    );
    setLoading(false);

    if (!result.ok || !result.data) {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      return;
    }

    const request: AnalysisRequestListItem = {
      analysisRequestId: result.data.analysisRequestId,
      status: result.data.status ?? 'QUEUED',
      hasReport: false,
      requestedAt: result.data.createdAt ?? new Date().toISOString(),
    };

    const nextCard = buildPendingCard(
      sprints.find((sprint) => sprint.sprintId === trimmed),
      request,
    );

    setReportsBySprint((prev) => ({
      ...prev,
      [trimmed]: [nextCard, ...(prev[trimmed] ?? []).filter((card) => card.analysisRequestId !== nextCard.analysisRequestId)],
    }));
    setSelectedReportId(nextCard.id);
    setSuccess(`분석 요청이 접수되었습니다. (ID: ${request.analysisRequestId})`);

  }

  const requestButtonLabel = '분석 요청';

  const sprintSelectDisabled = sprintsLoading || sprints.length === 0;
  const requestButtonDisabled =
    loading || sprintsLoading || !sprintId || todayRequestCount >= MAX_DAILY_REQUESTS;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line/40 bg-surface/90 p-4 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-[540px]">
            <label
              htmlFor="sprintId"
              className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-text-dim"
            >
              스프린트
            </label>
            <Select
              id="sprintId"
              value={sprintId}
              onChange={setSprintId}
              size="lg"
              disabled={sprintSelectDisabled}
              options={
                sprints.length === 0
                  ? [{ value: '', label: sprintsLoading ? '스프린트 불러오는 중...' : '선택 가능한 스프린트가 없습니다.' }]
                  : sprints.map((sprint) => ({ value: sprint.sprintId, label: sprint.name }))
              }
            />
            <p className="mb-0 mt-2 text-[12px] text-text-dim">
              {selectedSprint
                ? `${formatCompactDate(selectedSprint.startDate)} ~ ${formatCompactDate(selectedSprint.endDate)}`
                : sprintsLoading
                  ? '스프린트 목록을 불러오는 중입니다.'
                  : '선택 가능한 스프린트가 없습니다.'}
            </p>
            {todayRequestCount >= MAX_DAILY_REQUESTS ? (
              <p className="mb-0 mt-2 text-[12px] text-text-dim">
                하루에 이 스프린트에 대해 최대 3회까지만 분석 요청할 수 있습니다.
              </p>
            ) : null}
          </div>
          <Button type="submit" loading={loading} disabled={requestButtonDisabled}>
            {requestButtonLabel}
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
          <aside className="hidden min-h-[520px] flex-col overflow-hidden rounded-2xl border border-line/50 bg-surface-2/30 lg:flex">
            <div className="border-b border-line/50 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 text-[14px] font-semibold text-text">리포트 목록</h3>
                <span className="text-[12px] text-text-dim">
                  {requestsLoading ? '불러오는 중' : `${reports.length}개`}
                </span>
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
              ) : requestsLoading ? (
                <div className="rounded-xl border border-dashed border-line/60 bg-surface px-4 py-8 text-center text-[13px] text-text-dim">
                  리포트 목록을 불러오는 중입니다.
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
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-text-dim">
                            <span className="rounded-full border border-line/60 px-2 py-0.5 font-mono text-[10px]">
                              ID {formatRequestId(report.analysisRequestId)}
                            </span>
                            <span>{formatDateTime(report.createdAt ?? report.requestedAt)}</span>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusTone(report.status)}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </div>
                      <p className="mt-3 mb-0 text-[12px] leading-5 text-text-dim">
                        {getListSummary(report)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="min-h-[420px] overflow-hidden rounded-2xl border border-line/50 bg-surface">
            <div className="border-b border-line/50 px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between gap-2">
                <h3 className="m-0 text-[14px] font-semibold text-text">리포트</h3>
                <span className="text-[12px] text-text-dim">
                  {requestsLoading ? '불러오는 중' : `${reports.length}개`}
                </span>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {requestsLoading ? (
                  <div className="rounded-xl border border-dashed border-line/60 bg-surface-2/30 px-4 py-3 text-[12px] text-text-dim">
                    리포트 목록을 불러오는 중입니다.
                  </div>
                ) : reports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line/60 bg-surface-2/30 px-4 py-3 text-[12px] text-text-dim">
                    리포트가 없습니다.
                  </div>
                ) : (
                  reports.map((report) => {
                    const isSelected = selectedReportId === report.id;
                    return (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => setSelectedReportId(report.id)}
                        className={`flex w-[220px] shrink-0 flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition-colors ${
                          isSelected
                            ? 'border-accent/30 bg-accent-dim/30 shadow-sm'
                            : 'border-line/50 bg-surface-2/30'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusTone(report.status)}`}
                          >
                            {getStatusLabel(report.status)}
                          </span>
                          <span className="text-[10px] text-text-dim">{formatCompactDate(report.createdAt ?? report.requestedAt)}</span>
                        </div>
                        <div className="w-full truncate text-[12px] font-medium text-text">{report.title}</div>
                        <div className="rounded-full border border-line/60 px-2 py-0.5 font-mono text-[10px] text-text-dim">
                          ID {formatRequestId(report.analysisRequestId)}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
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
                        {selectedSprint.name} · {formatCompactDate(selectedSprint.startDate)} ~ {formatCompactDate(selectedSprint.endDate)}
                      </p>
                      <p className="mt-2 mb-0 font-mono text-[11px] text-text-dim">
                        Request ID {selectedReport.analysisRequestId}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusTone(selectedReport.status)}`}
                      >
                        {getStatusLabel(selectedReport.status)}
                      </span>
                      <span className="text-[12px] text-text-dim">
                        {formatDateTime(selectedReport.createdAt ?? selectedReport.requestedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {detailError ? (
                    <div className="mb-4 max-w-3xl rounded-2xl border border-red/30 bg-red/10 px-5 py-4 text-[13px] text-red">
                      {detailError}
                    </div>
                  ) : null}
                  {detailLoadingId === selectedReport.analysisRequestId ? (
                    <div className="max-w-3xl rounded-2xl border border-line/50 bg-surface-2/50 px-5 py-5">
                      <p className="m-0 text-[15px] font-medium text-text">리포트 본문을 불러오는 중입니다.</p>
                      <p className="mt-2 mb-0 text-[13px] leading-6 text-text-dim">
                        요청 카드에 연결된 리포트 내용을 동기화하고 있습니다.
                      </p>
                    </div>
                  ) : selectedReport.status === 'FAILED' ? (
                    <div className="max-w-3xl rounded-2xl border border-red/30 bg-red/10 px-5 py-4 text-[13px] text-red">
                      분석 리포트 생성이 실패했습니다. 같은 스프린트로 다시 요청하거나 백엔드 오류 로그를 확인해 주세요.
                    </div>
                  ) : selectedReport.status === 'RUNNING' || selectedReport.status === 'QUEUED' ? (
                    <div className="max-w-3xl rounded-2xl border border-line/50 bg-surface-2/50 px-5 py-5">
                      <p className="m-0 text-[15px] font-medium text-text">
                        {selectedReport.status === 'RUNNING' ? '분석이 진행 중입니다.' : '분석 요청이 접수되었습니다.'}
                      </p>
                      <p className="mt-2 mb-0 text-[13px] leading-6 text-text-dim">
                        리포트가 생성되면 새로고침 후 상세 내용을 확인해 주세요.
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line/60 bg-surface px-3 py-1.5 text-[12px] text-text-dim">
                        <span>요청 시각</span>
                        <span className="text-text">{formatDateTime(selectedReport.requestedAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-line/50 bg-surface-2/30 px-5 py-5">
                        <pre className="m-0 max-w-3xl whitespace-pre-wrap break-words font-sans text-[14px] leading-7 text-text">
                          {selectedReport.content || '분석 본문이 없습니다.'}
                        </pre>
                      </div>
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
