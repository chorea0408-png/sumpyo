import type { Team } from '../types';
import { thisWeekServiceDate } from './date';

const ICS_WEEKDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function icsEscape(s: string): string {
  return s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
}

/** 팀별 예배를 매주 반복되는 종일 일정으로 표현 — 실제 예배 시각은 데이터에 없어 날짜만 정확히 담는다 */
export function buildIcs(teams: Team[], now: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//sumpyo//KO',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:숨표 예배 일정',
  ];
  const stamp = `${icsDate(now)}T000000Z`;
  for (const team of teams) {
    const first = thisWeekServiceDate(team.serviceWeekday, now);
    lines.push(
      'BEGIN:VEVENT',
      `UID:sumpyo-${team.id}@sumpyo.app`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(first)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${ICS_WEEKDAY[team.serviceWeekday]}`,
      `SUMMARY:${icsEscape(`${team.shortName} ${team.serviceName}`)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcs(teams: Team[], now: Date): void {
  const content = buildIcs(teams, now);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sumpyo-services.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
