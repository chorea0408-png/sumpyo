import type { Task } from '../types';
import { TEAMS } from '../data/teams';
import { dueInfo, fmtDateLine } from './date';
import { overdue, pendingSorted } from './priority';

/** 카톡에 붙여넣는 주간 현황 텍스트 — Solo Utility First 전략의 접점 */
export function summaryText(tasks: Task[], now: Date): string {
  const lines = [`🎵 숨표 주간 현황 — ${fmtDateLine(now)}`];
  for (const team of TEAMS) {
    const ts = tasks.filter((t) => t.teamId === team.id);
    const done = ts.filter((t) => t.done).length;
    const next = pendingSorted(ts)[0];
    const od = overdue(ts, now).length;
    let line = `· ${team.shortName} ${team.serviceName} ${done}/${ts.length}`;
    if (!next) {
      line += ' — 준비 완료 🌿';
    } else {
      line += ` — 다음: ${next.title} (${dueInfo(next.due, now, next.allDay).label})`;
      if (od > 0) line += ` · 확인 필요 ${od}건`;
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
