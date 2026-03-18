'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui';

interface DeleteReasonDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  loading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  confirmLabel?: string;
  confirmPlaceholder?: string;
  confirmDescription?: string;
}

export function DeleteReasonDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = '삭제 사유 입력',
  description = '삭제 사유를 입력해 주세요.',
  confirmText,
  confirmLabel = '이름 확인',
  confirmPlaceholder,
  confirmDescription,
}: DeleteReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setConfirmValue('');
      setError('');
    }
  }, [open]);

  async function handleConfirm() {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('삭제 사유를 입력해 주세요.');
      return;
    }
    if (confirmText && confirmValue.trim() !== confirmText) {
      setError('확인 문구가 일치하지 않습니다.');
      return;
    }

    setError('');
    await onConfirm(trimmedReason);
  }

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} title={title}>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-[13px] text-text-soft">{description}</p>
        {confirmText ? (
          <div>
            <label htmlFor="delete-confirm" className="block text-[13px] font-medium text-text-soft mb-1.5">
              {confirmLabel} <span className="text-red">*</span>
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmValue}
              onChange={(event) => {
                setConfirmValue(event.target.value);
                if (error) setError('');
              }}
              placeholder={confirmPlaceholder ?? confirmText}
              className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              disabled={loading}
            />
            {confirmDescription ? <p className="m-0 mt-2 text-[12px] text-text-dim">{confirmDescription}</p> : null}
          </div>
        ) : null}
        <div>
          <label htmlFor="delete-reason" className="block text-[13px] font-medium text-text-soft mb-1.5">
            사유 <span className="text-red">*</span>
          </label>
          <textarea
            id="delete-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError('');
            }}
            placeholder="삭제 사유를 입력하세요"
            rows={4}
            className="w-full px-3 py-2.5 bg-surface-2 border border-line rounded-input text-[14px] placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
            disabled={loading}
            autoFocus
          />
        </div>
        {error ? (
          <div className="rounded-lg py-2.5 px-3 bg-red/15 border border-red/35" role="alert">
            <p className="m-0 text-[13px] text-red-400">{error}</p>
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button type="button" variant="danger" onClick={() => void handleConfirm()} loading={loading}>
            삭제
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
