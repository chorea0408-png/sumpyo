import type { LineupAssignment, LineupSlot, TeamId, TeamMember } from '../types';

export interface LineupPick {
  role: LineupSlot['role'];
  /** 슬롯 인원 수만큼의 자리 — 배정 없으면 null */
  memberIds: (string | null)[];
}

/** 이 팀·역할로 그 팀원이 가장 최근에 확정 라인업에 섰던 시각(ms) — 없으면 -1 */
function lastServedAt(history: LineupAssignment[], teamId: TeamId, memberId: string, role: string): number {
  let last = -1;
  for (const a of history) {
    if (a.teamId !== teamId || a.memberId !== memberId || a.role !== role) continue;
    const t = new Date(a.service).getTime();
    if (t > last) last = t;
  }
  return last;
}

/**
 * 역할별로 그 역할을 가진 팀원 중 "가장 최근에 안 섰던(혹은 한 번도 안 선)" 사람을 우선 추천.
 * 다른 역할에 이미 뽑힌 사람은 되도록 피하되, 작은 팀에서는 한 사람이 여러 역할을 겸하는 게
 * 정상이라 그 역할에 새로운 적격자가 부족할 때만 이미 뽑힌 사람도 후보로 채운다.
 * 싱어처럼 여러 명이 필요한 역할은 상위 N명을 추천한다.
 */
export function recommendLineup(
  teamId: TeamId,
  members: TeamMember[],
  slots: LineupSlot[],
  history: LineupAssignment[],
): LineupPick[] {
  const usedThisRound = new Set<string>();

  return slots.map((slot) => {
    const eligible = members.filter((m) => m.roles.includes(slot.role));
    const byRecency = (a: TeamMember, b: TeamMember) =>
      lastServedAt(history, teamId, a.id, slot.role) - lastServedAt(history, teamId, b.id, slot.role);
    const fresh = eligible.filter((m) => !usedThisRound.has(m.id)).sort(byRecency);
    const reused = eligible.filter((m) => usedThisRound.has(m.id)).sort(byRecency);
    const picked = [...fresh, ...reused].slice(0, slot.count);
    picked.forEach((m) => usedThisRound.add(m.id));
    const memberIds: (string | null)[] = picked.map((m) => m.id);
    while (memberIds.length < slot.count) memberIds.push(null);
    return { role: slot.role, memberIds };
  });
}

/** 확정된 라인업 선택을 히스토리 레코드로 변환 (빈 자리는 제외) */
export function toAssignments(teamId: TeamId, service: string, picks: LineupPick[]): LineupAssignment[] {
  const confirmedAt = new Date().toISOString();
  const out: LineupAssignment[] = [];
  for (const pick of picks) {
    for (const memberId of pick.memberIds) {
      if (!memberId) continue;
      out.push({
        id: crypto.randomUUID(),
        teamId,
        service,
        role: pick.role,
        memberId,
        confirmedAt,
      });
    }
  }
  return out;
}
