'use client';

import { ThemeToggle } from '@/components/theme-toggle';

/**
 * 화면 하단 좌측에 고정되는 테마(밝음/어두움) 전환 토글.
 * 리스트/칸반 토글처럼 밝음·어두움 두 옵션을 함께 보여줌.
 */
export function ThemeToggleFloating() {
  return (
    <div className="shrink-0 shadow-lg rounded-full">
      <ThemeToggle />
    </div>
  );
}
