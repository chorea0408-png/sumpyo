import type { Task, Team, TeamMember } from '../types';
import type { LineupPick } from './lineup';
import { roleLabel } from '../data/roles';
import { dueInfo, fmtDateLine, fmtDateShort } from './date';
import { overdue, pendingSorted } from './priority';

/** 카톡에 붙여넣는 주간 현황 텍스트 — Solo Utility First 전략의 접점 */
export function summaryText(tasks: Task[], teams: Team[], now: Date): string {
  const lines = [`🎵 숨표 주간 현황 — ${fmtDateLine(now)}`];
  for (const team of teams) {
    const ts = tasks.filter((t) => t.teamId === team.id);
    if (ts.length === 0) continue;
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

/** 확정된 라인업을 카톡에 붙여넣는 팀 공지문 텍스트로 변환 */
export function noticeText(team: Team, service: string, picks: LineupPick[], members: TeamMember[]): string {
  const nameOf = (id: string | null) => (id ? members.find((m) => m.id === id)?.name : undefined);
  const roleLines = picks
    .map((p) => {
      const names = p.memberIds.map(nameOf).filter((n): n is string => !!n);
      return names.length > 0 ? `${roleLabel(p.role)} - ${names.join(', ')}` : null;
    })
    .filter((l): l is string => !!l);

  const lines = [`📢 ${team.shortName} ${team.serviceName} 안내 (${fmtDateShort(new Date(service))})`, ''];
  if (roleLines.length > 0) {
    lines.push('🎤 라인업', ...roleLines, '');
  }
  lines.push(`콘티 ${team.songCount}곡 준비 중이에요. 특이사항 있으면 미리 알려주세요 🙏`);
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
