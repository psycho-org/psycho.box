'use client';

import { ViewModeToggle } from './view-mode-toggle';
import type { ViewDisplayMode } from './view-mode-toggle';

export interface ViewToggleFloatingProps {
  value: ViewDisplayMode;
  onChange: (value: ViewDisplayMode) => void;
  listLabel?: string;
  kanbanLabel?: string;
}

/**
 * 화면 하단 좌측에 고정되는 리스트/칸반(카드) 전환 토글.
 * 어떤 페이지에서든 사용 가능.
 */
export function ViewToggleFloating({
  value,
  onChange,
  listLabel = '리스트',
  kanbanLabel = '칸반',
}: ViewToggleFloatingProps) {
  return (
    <div className="fixed bottom-4 left-4 z-[60] shadow-lg rounded-full">
      <ViewModeToggle
        value={value}
        onChange={onChange}
        listLabel={listLabel}
        kanbanLabel={kanbanLabel}
      />
    </div>
  );
}
