/**
 * 로드맵 아이템 데이터
 */
export interface RoadmapItemData {
  id: string;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status?: string;
  assignee?: string;
}

/**
 * 기간 변경 시 콜백
 */
export interface PeriodChangePayload {
  id: string;
  startDate: string;
  endDate: string;
}
