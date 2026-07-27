import type { Project, ProjectExpense, Task, Team, TeamMember } from '../types';
import type { LineupPick } from './lineup';
import { roleLabel } from '../data/roles';
import { projectExpenseCategoryLabel } from '../data/projectExpenseCategories';
import { dueInfo, fmtDateLine, fmtDateShort } from './date';
import { overdue, pendingSorted } from './priority';

/** 카톡에 붙여넣는 주간 현황 텍스트 — Solo Utility First 전략의 접점 */
export function summaryText(tasks: Task[], teams: Team[], now: Date, signature?: string): string {
  const lines = [`🎵 숨표 주간 현황 — ${fmtDateLine(now)}`];
  for (const team of teams) {
    const ts = tasks.filter((t) => t.teamId === team.id);
    if (ts.length === 0) continue;
    const done = ts.filter((t) => t.done).length;
    // 답을 기다리는 중인 건 '다음에 할 일'이 아니다.
    // 그리고 누가 며칠째 답이 없는지는 절대 공유 텍스트에 넣지 않는다 — 개인 파악용 정보다.
    const next = pendingSorted(ts.filter((t) => !t.waiting))[0];
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
  if (signature && signature.trim()) lines.push('', signature.trim());
  return lines.join('\n');
}

/** 공지문 마무리 문장 기본값 — 곡 수를 그대로 반영한다(사용자 커스텀 문구는 고정 텍스트라 이걸 대신할 뿐) */
export const defaultNoticeClosing = (songCount: number) =>
  `콘티 ${songCount}곡 준비 중이에요. 특이사항 있으면 미리 알려주세요 🙏`;

/** 확정된 라인업을 카톡에 붙여넣는 팀 공지문 텍스트로 변환 */
export function noticeText(
  team: Team,
  service: string,
  picks: LineupPick[],
  members: TeamMember[],
  signature?: string,
  closingText?: string,
): string {
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
  lines.push(closingText && closingText.trim() ? closingText.trim() : defaultNoticeClosing(team.songCount));
  if (signature && signature.trim()) lines.push('', signature.trim());
  return lines.join('\n');
}

/** 프로젝트 지출 내역을 카톡에 붙여넣는 정산문 텍스트로 변환 */
export function projectSettlementText(
  project: Project,
  expenses: ProjectExpense[],
  signature?: string,
): string {
  const own = expenses
    .filter((e) => e.projectId === project.id)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const lines = [`📋 ${project.title} 정산`, ''];
  if (own.length === 0) {
    lines.push('기록된 지출이 없어요.');
  } else {
    for (const e of own) {
      lines.push(
        `· ${fmtDateShort(new Date(`${e.date}T00:00:00`))} ${projectExpenseCategoryLabel(e.category)} - ${e.title} ${e.amount.toLocaleString('ko-KR')}원`,
      );
    }
    const total = own.reduce((sum, e) => sum + e.amount, 0);
    lines.push('', `합계 ${total.toLocaleString('ko-KR')}원`);
  }
  if (signature && signature.trim()) lines.push('', signature.trim());
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
