'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { Button, CooldownCountdown, OtpInput, PasswordInput } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';
import { DEFAULT_PASSWORD_MESSAGE, getPasswordPolicyRegex } from '@/lib/password-policy';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [confirmationTokenId, setConfirmationTokenId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownAvailableAt, setCooldownAvailableAt] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState<{ regex: string; message: string } | null>(null);

  useEffect(() => {
    apiRequest<{ regex: string; message: string }>('/api/real/accounts/policies/password').then(
      (res) => res.ok && res.data && setPasswordPolicy(res.data),
    );
  }, []);

  const passwordRegex = getPasswordPolicyRegex(passwordPolicy?.regex);
  const passwordMessage = passwordPolicy?.message ?? DEFAULT_PASSWORD_MESSAGE;

  async function handleOtpRequest(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await apiRequest<{ challengeId: string }>(
      '/api/real/accounts/register/requests',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
    );

    setLoading(false);

    if (!result.ok) {
      if (result.code === 'CHALLENGE_OTP_COOLDOWN_ACTIVE' && result.meta?.availableAt) {
        setCooldownAvailableAt(result.meta.availableAt);
      }
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      return;
    }

    setCooldownAvailableAt(null);
    setChallengeId(result.data?.challengeId ?? '');
    setStep(2);
  }

  async function handleOtpConfirm(event: FormEvent) {
    event.preventDefault();
    const code = otpCode.replace(/\D/g, '');
    if (code.length < 6) {
      setError('OTP 6자리를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');

    const result = await apiRequest<{ confirmationTokenId: string }>(
      '/api/real/accounts/register/confirmations',
      {
        method: 'POST',
        body: JSON.stringify({ challengeId, otpCode: code }),
      },
    );

    setLoading(false);

    if (!result.ok) {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      return;
    }

    setConfirmationTokenId(result.data?.confirmationTokenId ?? '');
    setStep(3);
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await apiRequest(
      '/api/real/accounts/register',
      {
        method: 'POST',
        body: JSON.stringify({
          confirmationTokenId,
          password,
          givenName,
          familyName,
        }),
      },
    );

    setLoading(false);

    if (!result.ok) {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <AuthCard title="회원가입 완료">
        <p className="text-text-soft text-[13px]">
          계정이 생성되었습니다. 로그인 페이지에서 로그인해 주세요.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block border border-transparent rounded-lg bg-accent text-white py-2.5 px-3.5 hover:bg-accent-soft"
        >
          로그인
        </Link>
      </AuthCard>
    );
  }

  const steps = [
    { num: 1, label: '이메일' },
    { num: 2, label: 'OTP' },
    { num: 3, label: '계정 정보' },
  ] as const;

  return (
    <AuthCard title="회원가입">
      <nav className="mb-5 overflow-hidden" aria-label="회원가입 단계">
        <div className="relative w-full overflow-hidden" style={{ height: 42 }}>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 276 42"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* STEP 1: 좌측 직선, 우측 chevron (0~100) */}
            <path
              d="M 0 0 L 0 42 L 88 42 L 100 21 L 88 0 Z"
              fill={
                step === 1
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-3)'
              }
            />
            {/* STEP 2: 좌측 chevron, 우측 chevron (88~188) */}
            <path
              d="M 88 0 L 100 21 L 88 42 L 176 42 L 188 21 L 176 0 Z"
              fill={
                step === 2
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-3)'
              }
            />
            {/* STEP 3: 좌측 chevron, 우측 직선 (176~276) */}
            <path
              d="M 176 0 L 188 21 L 176 42 L 276 42 L 276 0 Z"
              fill={
                step === 3
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-3)'
              }
            />
          </svg>
          <div className="absolute inset-0 flex overflow-hidden">
            {steps.map((s) => (
              <span
                key={s.num}
                className="flex flex-1 items-center justify-center gap-1.5 text-sm font-semibold min-w-0 overflow-hidden px-1"
                style={{
                  color:
                    step === s.num
                      ? 'white'
                      : step > s.num
                        ? 'var(--color-accent)'
                        : 'var(--color-text-dim)',
                }}
              >
                {step > s.num ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : null}
                <span className="flex min-w-0 items-center justify-center gap-1.5 overflow-hidden">
                  {step > s.num ? null : step === s.num ? null : <span className="shrink-0">STEP {s.num}</span>}
                  <span className={`min-w-0 truncate ${step === s.num ? 'opacity-90' : 'opacity-80'}`}>
                    {s.label}
                  </span>
                </span>
              </span>
            ))}
          </div>
        </div>
      </nav>
      {step === 1 && (
        <div className="min-h-[138px]">
          <form className="grid gap-3" onSubmit={handleOtpRequest}>
            <label className="grid gap-1.5 text-[13px] text-text-soft">
            이메일
            <input
              className="w-full border border-line rounded-input bg-surface-2 text-text py-2.5 px-3 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <Button type="submit" loading={loading} disabled={!!cooldownAvailableAt}>
            OTP 요청
          </Button>
        </form>
        </div>
      )}

      {step === 2 && (
        <form className="grid gap-3 place-items-center" onSubmit={handleOtpConfirm}>
          <label className="grid gap-1.5 text-[13px] text-text-soft mb-4 w-full place-items-center">
            OTP 코드
            <OtpInput
              value={otpCode}
              onChange={(v) => setOtpCode(v.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              className="mt-1"
            />
          </label>
          <Button type="submit" loading={loading} className="w-full">
            확인
          </Button>
          <div className="mt-2 space-y-1 w-full text-center">
            <p className="text-text-soft text-[13px]">
              {email}로 발송된 OTP 코드를 입력하세요.
            </p>
            <p className="text-text-dim text-[11px]">
              인증 코드는 유효기간이 있습니다. 만료되면 이메일 변경 후 다시 요청해 주세요.
            </p>
          </div>
          <div className="flex justify-center gap-4 w-full">
            <button
              type="button"
              onClick={() => {
                setError('');
                setOtpCode('');
                setChallengeId('');
                setStep(1);
              }}
              className="text-text-dim text-[13px] hover:text-text-soft"
            >
              이메일 변경
            </button>
            <Link
              href="/login"
              className="text-text-dim text-[13px] hover:text-text-soft transition-colors"
            >
              로그인
            </Link>
          </div>
        </form>
      )}

      {step === 3 && (
        <form className="grid gap-3" onSubmit={handleRegister}>
          <label className="grid gap-1.5 text-[13px] text-text-soft">
            이메일
            <input
              className="w-full border border-line/60 rounded-input bg-surface-3 text-text-soft py-2.5 px-3 font-[inherit] cursor-default"
              type="text"
              value={email}
              readOnly
              tabIndex={-1}
              aria-readonly
            />
          </label>
          <PasswordInput
            label="비밀번호"
            value={password}
            onChange={setPassword}
            minLength={12}
            maxLength={64}
            required
            helperText={passwordMessage}
            validateWith={passwordRegex}
          />
          <label className="grid gap-1.5 text-[13px] text-text-soft">
            이름
            <input
              className="w-full border border-line rounded-input bg-surface-2 text-text py-2.5 px-3 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
              type="text"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              placeholder="이름"
              required
            />
          </label>
          <label className="grid gap-1.5 text-[13px] text-text-soft">
            성
            <input
              className="w-full border border-line rounded-input bg-surface-2 text-text py-2.5 px-3 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="성"
              required
            />
          </label>
          <Button type="submit" loading={loading}>
            회원가입
          </Button>
          <p className="mt-2 text-text-dim text-[11px]">
            확인 토큰은 유효기간이 있습니다. 만료되면 1단계부터 다시 진행해 주세요.
          </p>
        </form>
      )}

      {cooldownAvailableAt ? (
        <div className="mt-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/[0.16] border border-red/35 text-[#ffc4cf]">
          <CooldownCountdown
            availableAt={cooldownAvailableAt}
            onComplete={() => {
              setCooldownAvailableAt(null);
              setError('');
            }}
            message="{seconds}초 후 재요청 가능"
            className="!text-[#ffc4cf] m-0"
          />
        </div>
      ) : error ? (
        <p className="mt-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/[0.16] border border-red/35 text-[#ffc4cf]">
          {error}
        </p>
      ) : null}

      {step !== 2 && (
        <div className="mt-3 flex justify-center">
          <Link
            href="/login"
            className="text-text-dim text-[13px] hover:text-text-soft transition-colors"
          >
            로그인
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
