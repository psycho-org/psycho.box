/**
 * 날짜 유틸리티
 */

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function getWeekDates(startDate: Date, weekCount: number): Date[] {
  const dates: Date[] = [];
  for (let w = 0; w < weekCount; w++) {
    for (let d = 0; d < 7; d++) {
      dates.push(addDays(startDate, w * 7 + d));
    }
  }
  return dates;
}
