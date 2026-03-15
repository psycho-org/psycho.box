import type { ViewDisplayMode } from '@/components/ui/view-mode-toggle';

export interface ViewTogglePageConfig {
  /** pathname이 이 문자열로 끝나면 적용 (예: '/board', '/members') */
  pathEndsWith: string;
  /** URL에서 현재 display 값 읽기 */
  getValue: (display: string | null) => ViewDisplayMode;
  /** list 모드일 때 display 파라미터 값, null이면 파라미터 삭제 */
  listParamValue: string | null;
  /** kanban/카드 모드일 때 display 파라미터 값, null이면 파라미터 삭제 */
  cardParamValue: string | null;
  /** 칸반 버튼 라벨 (예: '칸반', '카드') */
  kanbanLabel?: string;
}

/**
 * 리스트/칸반 토글을 지원하는 페이지 설정.
 * 새 페이지 추가 시 이 배열에 설정만 추가하면 됨.
 */
export const VIEW_TOGGLE_PAGES: ViewTogglePageConfig[] = [
  {
    pathEndsWith: '/board',
    getValue: (display) => (display === 'list' ? 'list' : 'kanban'),
    listParamValue: 'list',
    cardParamValue: null, // kanban이 기본값
    kanbanLabel: '칸반',
  },
  {
    pathEndsWith: '/members',
    getValue: (display) => (display === 'card' ? 'kanban' : 'list'),
    listParamValue: null, // list가 기본값
    cardParamValue: 'card',
    kanbanLabel: '카드',
  },
];
