'use client';

import { ThemeToggle } from '@/components/theme-toggle';

/**
 * 화면 하단 좌측에 고정되는 테마(밝음/어두움) 전환 토글.
 */
export function ThemeToggleFloating() {
  return (
    <div className="shadow-lg rounded-full bg-surface-2/80 backdrop-blur-sm p-0.5">
      <ThemeToggle className="size-8 rounded-full" />
    </div>
  );
}
