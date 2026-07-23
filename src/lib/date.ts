export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
export const DAY_MS = 86_400_000;

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** 월요일 00:00 기준 주 시작 */
export function startOfWeek(d: Date = new Date()): Date {
  const x = startOfDay(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function atTime(base: Date, dayOffset: number, hour: number, minute = 0): string {
  const x = new Date(base);
  x.setDate(x.getDate() + dayOffset);
  x.setHours(hour, minute, 0, 0);
  return x.toISOString();
}

export function fmtTime(d: Date): string {
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function fmtDateLine(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS_KO[d.getDay()]}요일`;
}

export function fmtDateShort(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS_KO[d.getDay()]})`;
}

export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 이번 주(월요일 시작) 안에서 해당 요일의 예배 날짜 */
export function thisWeekServiceDate(weekday: number, now: Date = new Date()): Date {
  const monday = startOfWeek(now);
  const offset = (weekday + 6) % 7; // 월=0 … 일=6
  return addDays(monday, offset);
}

/** 마감/예배가 특정 주(월~일)에 속하는지 */
export function isInWeek(iso: string, weekStart: Date): boolean {
  const t = new Date(iso).getTime();
  const s = weekStart.getTime();
  return t >= s && t < s + 7 * DAY_MS;
}

/** 예배까지 남은 날 표기 — 오늘/내일/D-n/지난 예배 */
export function ddayLabel(date: Date, now: Date): string {
  const diff = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);
  if (diff < 0) return '지난 예배';
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return `D-${diff}`;
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later';

export interface DueInfo {
  label: string;
  sub?: string;
  tone: DueTone;
}

/** 마감 표기 — 죄책감 대신 '확인이 필요해요' 톤 유지 */
export function dueInfo(dueIso: string, now: Date, allDay = false): DueInfo {
  const due = new Date(dueIso);
  const dayDiff = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / DAY_MS);
  const time = allDay ? '' : ` ${fmtTime(due)}`;

  if (due.getTime() < now.getTime()) {
    return {
      tone: 'overdue',
      label: '확인이 필요해요',
      sub: `${WEEKDAYS_KO[due.getDay()]}요일${time}에 예정된 일이에요`,
    };
  }
  if (dayDiff <= 0) return { tone: 'today', label: allDay ? '오늘까지' : `오늘 ${fmtTime(due)}까지` };
  if (dayDiff === 1) return { tone: 'soon', label: allDay ? '내일까지' : `내일 ${fmtTime(due)}까지` };
  if (dayDiff < 7) return { tone: 'later', label: `${WEEKDAYS_KO[due.getDay()]}요일${time}까지` };
  return { tone: 'later', label: `${due.getMonth() + 1}월 ${due.getDate()}일까지` };
}
