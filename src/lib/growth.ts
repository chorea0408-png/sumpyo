import type { LineupAssignment, LineupRole, Team, TeamMember } from '../types';
import { roleLabel } from '../data/roles';
import { nextServiceOn } from './date';

export interface RoleCount {
  role: LineupRole;
  count: number;
}

export interface MemberGrowthStat {
  member: TeamMember;
  roleCounts: RoleCount[];
}

/**
 * 팀원별 · 현재 보유 역할별 확정 라인업 횟수.
 * - roles가 빈 배열인 팀원은 집계할 역할 자체가 없어 제외.
 * - 현재 자격은 있지만 한 번도 안 선 역할도 0회로 노출(숨기지 않음 — 로테이션 사각지대 신호).
 * - '다음 예배'(아직 안 지난 확정 라인업)는 LineupHistory.tsx와 같은 컨벤션으로 집계에서 제외 —
 *   아직 서지 않았는데 '섰다'고 세면 안 된다.
 */
export function memberGrowthStats(team: Team, history: LineupAssignment[], now: Date): MemberGrowthStat[] {
  const upcoming = nextServiceOn(team.serviceWeekday, now).toISOString();
  const own = history.filter((a) => a.teamId === team.id && a.service !== upcoming);
  const members = (team.members ?? []).filter((m) => m.roles.length > 0);

  return members.map((member) => ({
    member,
    roleCounts: member.roles.map((role) => ({
      role,
      count: own.filter((a) => a.memberId === member.id && a.role === role).length,
    })),
  }));
}

/** 팀원 행 하나를 "메인 8회 · 드럼 2회" 형태 문자열로 */
export function formatRoleCounts(roleCounts: RoleCount[]): string {
  return roleCounts.map((rc) => `${roleLabel(rc.role)} ${rc.count}회`).join(' · ');
}

/**
 * 팀 하이라이트 한 줄.
 * 1순위: 현재 맡을 수 있는 역할인데 한 번도 안 선 사람이 있으면 그 사각지대를 콕 집는다.
 * 2순위: 사각지대가 없으면 지금까지 가장 많이 선 팀원을 알려준다.
 * 데이터/팀원이 없으면 null.
 */
export function memberGrowthHighlight(stats: MemberGrowthStat[]): string | null {
  if (stats.length === 0) return null;

  for (const s of stats) {
    const zero = s.roleCounts.find((rc) => rc.count === 0);
    if (zero) return `${s.member.name}님은 ${roleLabel(zero.role)} 역할을 맡을 수 있지만 아직 한 번도 서지 않았어요`;
  }

  const totals = stats.map((s) => ({
    member: s.member,
    total: s.roleCounts.reduce((sum, rc) => sum + rc.count, 0),
  }));
  const busiest = totals.reduce((a, b) => (b.total > a.total ? b : a));
  if (busiest.total === 0) return null;
  return `${busiest.member.name}님이 지금까지 가장 많은 라인업에 섰어요 — 총 ${busiest.total}회`;
}
