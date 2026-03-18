/**
 * 태스크 상태 타입 (API와 동기화)
 */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'BACKLOG';

/**
 * BACKLOG: 테두리만(투명 내부), 연한 회색 점선
 * 그 외: 채우기 색상
 */
export const TASK_STATUS_IS_OUTLINE: Record<TaskStatus, boolean> = {
  TODO: false,
  IN_PROGRESS: false,
  DONE: false,
  CANCELLED: false,
  BACKLOG: true,
} as const;

/**
 * 태스크 상태별 색상 (톤 통일: 채도·밝기 유사)
 * - TODO: 노란색
 * - IN_PROGRESS: 녹색
 * - DONE: 보라색
 * - CANCELLED: 회색
 * - BACKLOG: 연한 회색 (테두리만)
 */
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'var(--theme-task-todo)',
  IN_PROGRESS: 'var(--theme-task-inprogress)',
  DONE: 'var(--theme-task-done)',
  CANCELLED: 'var(--theme-task-cancelled)',
  BACKLOG: 'var(--theme-task-backlog)',
} as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: '할일',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  CANCELLED: '취소됨',
  BACKLOG: '백로그',
} as const;
