'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui';
import { apiRequest } from '@/lib/client';
import { getErrorMessage } from '@/lib/error-messages';

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface WorkspaceDetail {
  id: string;
  name: string;
  description?: string;
}

export function CreateWorkspaceModal({ open, onClose, onSuccess }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleClose() {
    if (!loading) {
      setName('');
      setDescription('');
      setError('');
      onClose();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('워크스페이스 이름을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const result = await apiRequest<WorkspaceDetail>('/api/real/workspaces', {
      method: 'POST',
      body: JSON.stringify({
        name: trimmedName,
        ...(description.trim() && { description: description.trim() }),
      }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(getErrorMessage({ code: result.code, message: result.message, status: result.status }));
      return;
    }

    const workspaceId = result.data?.id;
    handleClose();
    onSuccess?.();

    if (workspaceId) {
      router.push(`/workspaces/${workspaceId}/board`);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} title="새 워크스페이스 생성">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="workspace-name" className="block text-[13px] font-medium text-text-soft mb-1.5">
            워크스페이스 이름
          </label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: DevTeam Alpha"
            className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={loading}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="workspace-description" className="block text-[13px] font-medium text-text-soft mb-1.5">
            설명 <span className="text-text-dim">(선택)</span>
          </label>
          <textarea
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 워크스페이스는 어떤 팀을 위한 공간인가요?"
            rows={3}
            className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>
        {error && (
          <p className="m-0 text-[13px] text-red" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end mt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button type="submit" loading={loading} disabled={!name.trim()}>
            생성
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
