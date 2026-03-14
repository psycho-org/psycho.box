'use client';

import { FormEvent, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function isValidEmail(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 && EMAIL_REGEX.test(trimmed);
}

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceName?: string;
  onSuccess?: () => void;
}

export function AddMemberModal({ open, onClose, workspaceId, workspaceName: initialWorkspaceName, onSuccess }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleClose() {
    if (!loading) {
      setEmail('');
      setError('');
      onClose();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('이메일 주소를 입력해 주세요.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    setLoading(true);
    setError('');

    let workspaceName = initialWorkspaceName;
    if (!workspaceName) {
      const wsResult = await apiRequest<{ name?: string; title?: string }>(
        `/api/real/workspaces/${workspaceId}`,
      );
      if (wsResult.ok && wsResult.data) {
        workspaceName = wsResult.data.name ?? wsResult.data.title ?? '워크스페이스';
      } else {
        workspaceName = '워크스페이스';
      }
    }

    const mailResult = await apiRequest<{ status?: string }>(
      '/api/real/mails/send/workspaceinvite',
      {
        method: 'POST',
        body: JSON.stringify({
          to: trimmedEmail,
          workspaceName,
          workspaceId,
        }),
      },
    );

    setLoading(false);

    if (!mailResult.ok) {
      setError(getErrorMessage({ code: mailResult.code, message: mailResult.message, status: mailResult.status }));
      return;
    }

    handleClose();
    onSuccess?.();
  }

  return (
    <Dialog open={open} onClose={handleClose} title="멤버 초대">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="member-email" className="block text-[13px] font-medium text-text-soft mb-1.5">
            이메일 주소
          </label>
          <input
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="colleague@example.com"
            className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-lg text-[14px] placeholder:text-text-dim focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            disabled={loading}
            autoFocus
          />
        </div>
        {error && (
          <div className="rounded-lg py-2.5 px-3 bg-red/15 border border-red/35" role="alert">
            <p className="m-0 text-[13px] text-red-400">{error}</p>
            <p className="m-0 mt-1 text-[12px] text-text-soft">이메일을 확인하고 다시 시도해 주세요.</p>
          </div>
        )}
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button type="submit" loading={loading} disabled={!email.trim()}>
            {error ? '다시 시도' : '초대'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
