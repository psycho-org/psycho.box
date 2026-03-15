'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/client';

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function getInitials(user: User): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  const email = (user.email ?? '').trim();
  if (email) return email.slice(0, 2).toUpperCase();
  return '?';
}

function getDisplayName(user: User): string {
  const first = (user.firstName ?? '').trim();
  const last = (user.lastName ?? '').trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  return (user.email ?? '').trim() || '사용자';
}

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    apiRequest<{ user?: User }>('/api/real/auth/me')
      .then((result) => {
        if (result.ok && result.data?.user) {
          setUser(result.data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await apiRequest('/api/real/auth/logout', { method: 'POST' });
    setOpen(false);
    router.push('/login');
    setLoggingOut(false);
  }

  if (loading) {
    return (
      <div className="shrink-0 h-9 w-16 rounded-lg bg-surface-2 animate-pulse" aria-hidden />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="shrink-0 text-[12px] lg:text-[13px] text-text-soft hover:text-text transition-colors"
      >
        로그인
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-accent to-[#f06aaf] grid place-items-center text-[11px] font-bold text-white">
          {getInitials(user)}
        </div>
        <span className="hidden sm:inline text-[13px] font-medium truncate max-w-[120px]">
          {getDisplayName(user)}
        </span>
        <ChevronDownIcon
          className={`shrink-0 text-text-dim transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 py-1.5 bg-surface-2 border border-line rounded-[10px] shadow-lg z-50 min-w-[180px] overflow-hidden">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-text-soft hover:bg-surface-3 hover:text-text transition-colors"
          >
            <UserIcon className="shrink-0 text-text-dim" />
            <span>프로필/계정 설정</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-text-soft hover:bg-surface-3 hover:text-text transition-colors text-left disabled:opacity-60"
          >
            <LogOutIcon className="shrink-0 text-text-dim" />
            <span>{loggingOut ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
