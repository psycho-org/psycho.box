import Link from 'next/link';

interface WorkspaceInviteResultCardProps {
  title: string;
  descriptionLines: [string, string];
  detailLines: [string, string];
  tone: 'success' | 'failure';
}

const toneStyles = {
  success: {
    badge: 'border-green/35 bg-green/12 text-green',
    halo: 'bg-[radial-gradient(circle_at_top,rgba(62,207,142,0.22),transparent_68%)]',
    ring: 'border-green/20 bg-green/10',
    icon: 'border-green/30 bg-green/14 text-green',
    panel: 'border-green/18 bg-green/8',
    label: '초대 수락 성공',
    symbol: '✓',
  },
  failure: {
    badge: 'border-red/35 bg-red/12 text-red',
    halo: 'bg-[radial-gradient(circle_at_top,rgba(255,77,109,0.2),transparent_68%)]',
    ring: 'border-red/18 bg-red/8',
    icon: 'border-red/30 bg-red/12 text-red',
    panel: 'border-red/18 bg-red/7',
    label: '초대 수락 실패',
    symbol: '!',
  },
} as const;

export function WorkspaceInviteResultCard({
  title,
  descriptionLines,
  detailLines,
  tone,
}: WorkspaceInviteResultCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="relative w-full max-w-[640px] overflow-hidden rounded-[24px] border border-line/70 bg-surface shadow-[0_32px_80px_rgba(0,0,0,0.42)]">
      <div className={`pointer-events-none absolute inset-0 opacity-90 ${styles.halo}`} aria-hidden />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto flex max-w-[480px] flex-col items-center text-center">
          <p className="m-0 text-accent-soft text-xs uppercase tracking-[0.18em]">Psycho.Box</p>

          <div className={`mt-6 flex size-24 items-center justify-center rounded-full border ${styles.ring}`}>
            <div
              className={`flex size-16 items-center justify-center rounded-full border text-[28px] font-semibold ${styles.icon}`}
              aria-hidden
            >
              {styles.symbol}
            </div>
          </div>

          <span className={`mt-6 inline-flex rounded-full border px-3 py-1.5 text-[11px] font-medium ${styles.badge}`}>
            {styles.label}
          </span>

          <h1 className="mb-0 mt-5 text-[30px] leading-[1.15] text-text sm:text-[34px]">{title}</h1>
          <div className="mt-4 space-y-2 text-[15px] leading-7 text-text-soft sm:text-[16px]">
            <p className="m-0">{descriptionLines[0]}</p>
            <p className="m-0">{descriptionLines[1]}</p>
          </div>

          <div className={`mt-6 w-full rounded-[20px] border px-5 py-4 ${styles.panel}`}>
            <div className="space-y-1.5 text-[13px] leading-6 text-text-soft">
              <p className="m-0">{detailLines[0]}</p>
              <p className="m-0">{detailLines[1]}</p>
            </div>
          </div>

          <Link
            href="/login"
            className="mt-7 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-transparent bg-accent px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-accent-soft"
          >
            로그인
          </Link>

          <p className="mb-0 mt-3 text-[12px] text-text-dim">
            로그인 후 워크스페이스 목록에서 초대 반영 여부를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
