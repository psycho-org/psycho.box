'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type DatePickerMode = 'single' | 'range' | 'multiple';

export type DatePickerValue =
  | string | null
  | { start: string; end: string } | null
  | string[];

export interface DatePickerProps {
  /** single: 단일일자, range: 기간(드래그), multiple: 여러일자 */
  mode: DatePickerMode;
  value: DatePickerValue;
  onChange: (value: DatePickerValue) => void;
  /** 선택 가능 최소일 (YYYY-MM-DD) */
  minDate?: string;
  /** 선택 가능 최대일 (YYYY-MM-DD) */
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 팝업 위치: bottom(기본)=트리거 좌측 정렬 아래, bottom-end=트리거 우측 정렬 아래, right=트리거 오른쪽 */
  popupPlacement?: 'bottom' | 'bottom-end' | 'right';
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toYMD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) {
    days.push(new Date(year, month, 1 - startPad + i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

function formatDateForDisplay(s: string): string {
  const [y, m, d] = s.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}`;
}

function formatDisplay(mode: DatePickerMode, value: DatePickerValue): string {
  if (value == null) return '';
  if (mode === 'single') return formatDateForDisplay(value as string);
  if (mode === 'range') {
    const r = value as { start: string; end: string };
    if (r.start && r.end) return `${formatDateForDisplay(r.start)} ~ ${formatDateForDisplay(r.end)}`;
    return r.start ? formatDateForDisplay(r.start) : r.end ? formatDateForDisplay(r.end) : '';
  }
  if (mode === 'multiple') {
    const arr = value as string[];
    return arr.length ? arr.sort().map(formatDateForDisplay).join(', ') : '';
  }
  return '';
}

function isInRange(dateStr: string, start: string, end: string): boolean {
  if (!start || !end) return false;
  return dateStr >= start && dateStr <= end;
}

function isSelected(
  dateStr: string,
  mode: DatePickerMode,
  value: DatePickerValue,
): boolean {
  if (value == null) return false;
  if (mode === 'single') return (value as string) === dateStr;
  if (mode === 'range') {
    const r = value as { start: string; end: string };
    return isInRange(dateStr, r.start, r.end) || isInRange(dateStr, r.end, r.start);
  }
  if (mode === 'multiple') return (value as string[]).includes(dateStr);
  return false;
}

function isStartOrEnd(dateStr: string, value: DatePickerValue): 'start' | 'end' | false {
  if (value == null || typeof value !== 'object' || !('start' in value)) return false;
  const r = value as { start: string; end: string };
  if (r.start === dateStr) return 'start';
  if (r.end === dateStr) return 'end';
  return false;
}

export function DatePicker({
  mode,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = '날짜 선택',
  disabled = false,
  className = '',
  popupPlacement = 'bottom',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    const v = mode === 'single' && value ? value as string : mode === 'range' && value ? (value as { start: string; end: string }).start : null;
    if (v) return parseYMD(v).getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const v = mode === 'single' && value ? value as string : mode === 'range' && value ? (value as { start: string; end: string }).start : null;
    if (v) return parseYMD(v).getMonth();
    return new Date().getMonth();
  });
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [popupStyle, setPopupStyle] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setPopupStyle(null);
      return;
    }
    const trigger = triggerRef.current;
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      const popupHeight = 340;
      const popupWidth = 300;
      const gap = 8;
      const padding = 16;

      if (popupPlacement === 'right') {
        // 오른쪽에 배치: 트리거 오른쪽에 표시, 세로는 트리거 상단 기준
        let left = rect.right + gap;
        let top = rect.top;
        // 오른쪽 공간 부족 → 왼쪽에 배치
        if (left + popupWidth > window.innerWidth - padding) {
          left = rect.left - popupWidth - gap;
        }
        // 아래 공간 부족 → 위로 올림
        if (top + popupHeight > window.innerHeight - padding) {
          top = window.innerHeight - popupHeight - padding;
        }
        if (top < padding) top = padding;
        if (left < padding) left = padding;
        setPopupStyle({ top, left });
      } else if (popupPlacement === 'bottom-end') {
        // 아래에 배치하되, 우측 정렬 (트리거의 오른쪽 끝과 팝업의 오른쪽 끝을 맞춤)
        const spaceBelow = window.innerHeight - rect.bottom - padding;
        const spaceAbove = rect.top - padding;
        const openAbove = spaceBelow < popupHeight && spaceAbove >= spaceBelow;
        const top = openAbove ? rect.top - popupHeight - gap : rect.bottom + gap;
        let left = rect.right - popupWidth;
        if (left < padding) left = padding;
        setPopupStyle({ top, left });
      } else {
        // 기본 (bottom): 아래에 배치, 좌측 정렬
        const spaceBelow = window.innerHeight - rect.bottom - padding;
        const spaceAbove = rect.top - padding;
        const openAbove = spaceBelow < popupHeight && spaceAbove >= spaceBelow;
        const top = openAbove ? rect.top - popupHeight - gap : rect.bottom + gap;
        let left = rect.left;
        if (left + popupWidth > window.innerWidth - padding) left = window.innerWidth - popupWidth - padding;
        if (left < padding) left = padding;
        setPopupStyle({ top, left });
      }
    }
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (ref.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, popupPlacement]);

  useEffect(() => {
    if (mode !== 'range' || !isDragging) return;
    function handleMouseUp() {
      setIsDragging(false);
      setRangeStart(null);
    }
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [mode, isDragging]);

  const days = getDaysInMonth(viewYear, viewMonth);
  const display = formatDisplay(mode, value);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function goToday() {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    if (mode === 'single') onChange(toYMD(t));
    setOpen(false);
  }

  function handleDateClick(dateStr: string) {
    if (disabled) return;
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;

    if (mode === 'single') {
      onChange(dateStr);
      setOpen(false);
      return;
    }

    if (mode === 'range') {
      if (!rangeStart) {
        setRangeStart(dateStr);
        onChange({ start: dateStr, end: dateStr });
        return;
      }
      const [s, e] = [rangeStart, dateStr].sort();
      onChange({ start: s, end: e });
      setRangeStart(null);
      setOpen(false);
      return;
    }

    if (mode === 'multiple') {
      const arr = (value as string[]) ?? [];
      const next = arr.includes(dateStr) ? arr.filter((x) => x !== dateStr) : [...arr, dateStr].sort();
      onChange(next);
      return;
    }
  }

  function handleDateMouseDown(dateStr: string) {
    if (mode !== 'range' || disabled) return;
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;
    setRangeStart(dateStr);
    setIsDragging(true);
    onChange({ start: dateStr, end: dateStr });
  }

  function handleDateMouseEnter(dateStr: string) {
    if (mode !== 'range' || !rangeStart || disabled) return;
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;
    const [s, e] = [rangeStart, dateStr].sort();
    onChange({ start: s, end: e });
  }

  function handleClear() {
    if (mode === 'single') onChange(null);
    if (mode === 'range') onChange(null);
    if (mode === 'multiple') onChange([]);
    setRangeStart(null);
  }

  const isCurrentMonth = (d: Date) => d.getMonth() === viewMonth;
  const todayStr = toYMD(new Date());

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-surface-2 border border-line rounded-xl text-[14px] text-left hover:border-line-2 hover:bg-surface-3/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition-all cursor-pointer ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <span className={display ? 'text-text' : 'text-text-dim'}>
          {display || placeholder}
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {display && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-text-dim hover:text-red/80 text-[11px] px-1.5 py-0.5 rounded transition-colors"
            >
              삭제
            </button>
          )}
          <span className="flex items-center justify-center size-8 rounded-lg bg-surface-3/50">
            <svg className="size-4 text-text-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
        </span>
      </div>

      {open && popupStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={popupRef}
              className="fixed z-[10000] w-[300px] bg-surface border border-line rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
              style={{ top: popupStyle.top, left: popupStyle.left }}
            >
              {/* 헤더 */}
              <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrevMonth}
                className="flex items-center justify-center size-9 rounded-xl hover:bg-surface-3 text-text-soft hover:text-text transition-colors"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <span className="text-[15px] font-semibold text-text tracking-tight">
                {viewYear}년 {viewMonth + 1}월
              </span>
              <button
                type="button"
                onClick={goNextMonth}
                className="flex items-center justify-center size-9 rounded-xl hover:bg-surface-3 text-text-soft hover:text-text transition-colors"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
            {/* 요일 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((w, idx) => (
                <span
                  key={w}
                  className={`py-1.5 text-center text-[11px] font-medium ${idx === 0 ? 'text-red/70' : 'text-text-dim'}`}
                >
                  {w}
                </span>
              ))}
              {days.map((d, i) => {
                const dateStr = toYMD(d);
                const current = isCurrentMonth(d);
                const selected = isSelected(dateStr, mode, value);
                const rangeEdge = mode === 'range' && isStartOrEnd(dateStr, value);
                const inRange = mode === 'range' && selected && !rangeEdge;
                const isToday = dateStr === todayStr;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleDateClick(dateStr)}
                    onMouseDown={() => handleDateMouseDown(dateStr)}
                    onMouseEnter={() => handleDateMouseEnter(dateStr)}
                    className={`
                      aspect-square rounded-xl text-[13px] font-medium transition-all duration-150
                      flex items-center justify-center
                      ${!current ? 'text-text-dim/60' : 'text-text'}
                      ${selected ? 'bg-accent text-white shadow-sm' : ''}
                      ${inRange ? 'bg-accent/20 text-accent-soft' : ''}
                      ${rangeEdge ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''}
                      ${!selected && !inRange ? 'hover:bg-surface-3' : ''}
                      ${isToday && !selected ? 'ring-1 ring-accent/50' : ''}
                    `}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          {/* 푸터 */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-2/50 border-t border-line">
            <span className="text-[11px] text-text-dim">
              {mode === 'range' && '드래그로 기간 선택'}
              {mode === 'single' && '날짜를 클릭하세요'}
              {mode === 'multiple' && '여러 날짜를 선택하세요'}
            </span>
            <button
              type="button"
              onClick={goToday}
              className="px-3 py-1.5 text-[12px] font-medium text-accent-soft hover:bg-accent-dim rounded-lg transition-colors"
            >
              오늘
            </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
