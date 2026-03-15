'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserMenu } from '@/components/user-menu';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const [pwStep, setPwStep] = useState<'idle' | 'request' | 'otp' | 'submit'>('idle');
  const [challengeId, setChallengeId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [confirmationTokenId, setConfirmationTokenId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    apiRequest<{ user?: User }>('/api/real/auth/me').then((result) => {
      if (result.ok && result.data?.user) {
        const u = result.data.user;
        setUser(u);
        setGivenName((u.firstName ?? '').trim());
        setFamilyName((u.lastName ?? '').trim());
      }
      setLoading(false);
    });
  }, []);

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);
    if (!givenName.trim()) {
      setNameError('이름을 입력해 주세요.');
      return;
    }

    setNameLoading(true);
    const result = await apiRequest('/api/real/accounts/me/update/name', {
      method: 'POST',
      body: JSON.stringify({ givenName: givenName.trim(), familyName: familyName.trim() }),
    });
    setNameLoading(false);

    if (result.ok) {
      setNameSuccess(true);
    } else {
      setNameError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
    }
  }

  async function handlePwRequest() {
    setPwError(null);
    setPwLoading(true);
    const result = await apiRequest<{ challengeId?: string }>(
      '/api/real/accounts/me/password/requests',
      { method: 'POST' },
    );
    setPwLoading(false);

    if (result.ok && result.data?.challengeId) {
      setChallengeId(result.data.challengeId);
      setPwStep('otp');
    } else {
      setPwError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
    }
  }

  async function handlePwOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    const code = otpCode.replace(/\D/g, '');
    if (code.length < 6) {
      setPwError('OTP 6자리를 입력해 주세요.');
      return;
    }

    setPwLoading(true);
    const result = await apiRequest<{ confirmationTokenId?: string }>(
      '/api/real/accounts/me/password/confirmations',
      {
        method: 'POST',
        body: JSON.stringify({ challengeId, otpCode: code }),
      },
    );
    setPwLoading(false);

    if (result.ok && result.data?.confirmationTokenId) {
      setConfirmationTokenId(result.data.confirmationTokenId);
      setPwStep('submit');
    } else {
      setPwError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
    }
  }

  async function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (!currentPassword || !newPassword) {
      setPwError('현재 비밀번호와 새 비밀번호를 입력해 주세요.');
      return;
    }

    setPwLoading(true);
    const result = await apiRequest('/api/real/accounts/me/password', {
      method: 'POST',
      body: JSON.stringify({
        confirmationTokenId,
        currentPassword,
        newPassword,
      }),
    });
    setPwLoading(false);

    if (result.ok) {
      setPwSuccess(true);
      setPwStep('idle');
      setOtpCode('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmationTokenId('');
    } else {
      setPwError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <header className="h-14 border-b border-line bg-surface px-4 flex items-center justify-between">
          <div className="h-6 w-24 bg-surface-2 animate-pulse rounded" />
          <UserMenu />
        </header>
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-text-soft">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex flex-col">
        <header className="h-14 border-b border-line bg-surface px-4 flex items-center justify-between">
          <h1 className="text-base font-semibold">계정</h1>
          <UserMenu />
        </header>
        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
          <p className="text-text-soft">로그인이 필요합니다.</p>
          <Link href="/login" className="text-accent hover:underline">
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="h-14 border-b border-line bg-surface px-4 lg:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/workspaces"
            className="shrink-0 size-9 flex items-center justify-center rounded-lg text-text-soft hover:bg-surface-2 hover:text-text -ml-1"
            aria-label="워크스페이스로 돌아가기"
          >
            <ArrowLeftIcon className="size-5" />
          </Link>
          <h1 className="m-0 text-base lg:text-lg font-semibold truncate">계정</h1>
        </div>
        <UserMenu />
      </header>

      <div className="flex-1 p-4 lg:p-6 overflow-auto max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {/* 프로필 정보 */}
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-base font-semibold mb-4">프로필</h2>
            <p className="text-[13px] text-text-soft mb-4">{user.email}</p>
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="givenName" className="block text-[13px] font-medium mb-1.5">
                    이름
                  </label>
                  <input
                    id="givenName"
                    type="text"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-line bg-bg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    disabled={nameLoading}
                  />
                </div>
                <div>
                  <label htmlFor="familyName" className="block text-[13px] font-medium mb-1.5">
                    성
                  </label>
                  <input
                    id="familyName"
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-line bg-bg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    disabled={nameLoading}
                  />
                </div>
              </div>
              <Button type="submit" loading={nameLoading} disabled={nameLoading}>
                이름 변경
              </Button>
            </form>
            {nameError && <p className="mt-4 text-[13px] text-red">{nameError}</p>}
            {nameSuccess && <p className="mt-4 text-[13px] text-green">이름이 변경되었습니다.</p>}
          </section>

          {/* 비밀번호 변경 */}
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-base font-semibold mb-4">비밀번호 변경</h2>
            {pwStep === 'idle' && (
              <>
                <p className="text-[13px] text-text-soft mb-4">
                  비밀번호를 변경하려면 이메일로 OTP를 요청한 뒤, OTP 확인 후 새 비밀번호를 입력해 주세요.
                </p>
                <Button onClick={() => handlePwRequest()} loading={pwLoading} disabled={pwLoading}>
                  OTP 요청
                </Button>
              </>
            )}
            {pwStep === 'otp' && (
              <form onSubmit={handlePwOtpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otpCode" className="block text-[13px] font-medium mb-1.5">
                    이메일로 전송된 OTP 6자리
                  </label>
                  <input
                    id="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-3 py-2.5 rounded-lg border border-line bg-bg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    disabled={pwLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={pwLoading} disabled={pwLoading}>
                    확인
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPwStep('idle');
                      setOtpCode('');
                      setChallengeId('');
                    }}
                  >
                    취소
                  </Button>
                </div>
              </form>
            )}
            {pwStep === 'submit' && (
              <form onSubmit={handlePwSubmit} className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-[13px] font-medium mb-1.5">
                    현재 비밀번호
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-line bg-bg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    disabled={pwLoading}
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-[13px] font-medium mb-1.5">
                    새 비밀번호
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-line bg-bg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    disabled={pwLoading}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={pwLoading} disabled={pwLoading}>
                    비밀번호 변경
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setPwStep('idle');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmationTokenId('');
                    }}
                  >
                    취소
                  </Button>
                </div>
              </form>
            )}
            {pwError && <p className="mt-4 text-[13px] text-red">{pwError}</p>}
            {pwSuccess && <p className="mt-4 text-[13px] text-green">비밀번호가 변경되었습니다.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
