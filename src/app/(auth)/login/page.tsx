'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { Button } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await apiRequest<{ accessToken: string }>('/api/real/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      return;
    }

    router.push('/workspaces');
  }

  return (
    <AuthCard title="로그인">
      <form className="grid gap-3" onSubmit={onSubmit}>
        <label className="grid gap-1.5 text-[13px] text-text-soft">
          이메일
          <input
            className="w-full border border-line rounded-[10px] bg-surface-2 text-text py-2.5 px-3 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="grid gap-1.5 text-[13px] text-text-soft">
          비밀번호
          <span className="relative flex">
            <input
              className="w-full border border-line rounded-[10px] bg-surface-2 text-text py-2.5 px-3 pr-10 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-dim hover:text-text-soft"
              title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </span>
        </label>

        <Button type="submit" loading={loading}>
          로그인
        </Button>
      </form>

      {error ? (
        <p className="mt-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/[0.16] border border-red/35 text-[#ffc4cf]">
          {error}
        </p>
      ) : null}

      <p className="mt-3 flex gap-4">
        <Link className="text-accent-soft underline" href="/register">
          회원가입
        </Link>
        <Link className="text-accent-soft underline" href="/workspaces">
          워크스페이스 (데모)
        </Link>
      </p>
    </AuthCard>
  );
}
