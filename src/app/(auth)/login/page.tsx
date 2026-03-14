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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const result = await apiRequest<{ accessToken?: string; user?: unknown }>('/api/real/auth/login', {
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
            required
          />
        </label>

        <label className="grid gap-1.5 text-[13px] text-text-soft">
          비밀번호
          <input
            className="w-full border border-line rounded-[10px] bg-surface-2 text-text py-2.5 px-3 font-[inherit] focus:outline-2 focus:outline-accent focus:outline-offset-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <Button type="submit" disabled={loading} loading={loading}>
          로그인
        </Button>
      </form>

      {error ? (
        <p className="my-2 rounded-lg py-2.5 px-3 text-[13px] bg-red/15 border border-red/35 text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex justify-center">
        <Link
          href="/register"
          className="text-text-dim text-[13px] hover:text-text-soft transition-colors"
        >
          회원가입
        </Link>
      </div>
    </AuthCard>
  );
}
