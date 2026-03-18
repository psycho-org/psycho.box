'use client';

import { useEffect, useState } from 'react';

export interface CooldownCountdownProps {
  /** ISO-8601 시각 (재요청 가능 시각) */
  availableAt: string;
  /** 카운트다운 완료 시 콜백 */
  onComplete?: () => void;
  /** 메시지 템플릿. {seconds}를 남은 초로 치환 */
  message?: string;
  className?: string;
}

export function CooldownCountdown({
  availableAt,
  onComplete,
  message = '{seconds}초 후 재요청 가능',
  className = '',
}: CooldownCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const end = new Date(availableAt).getTime();
    return Math.max(0, Math.ceil((end - Date.now()) / 1000));
  });

  useEffect(() => {
    const end = new Date(availableAt).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) onComplete?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [availableAt, onComplete]);

  if (secondsLeft <= 0) return null;

  return (
    <p className={`text-text-soft text-ui ${className}`} role="status" aria-live="polite">
      {message.replace('{seconds}', String(secondsLeft))}
    </p>
  );
}
