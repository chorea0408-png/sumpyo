import type { Task, Team } from '../types';
import { DAY_MS, isInWeek, monthKey, startOfWeek } from './date';

export interface WeekBucket {
  weekStart: Date;
  label: string;
  total: number;
  done: number;
  rate: number;
}

/** 최근 N주(이번 주 포함)의 완료율 추이 — 오래된 주부터 정렬 */
export function weeklyTrend(tasks: Task[], now: Date, weeks = 6): WeekBucket[] {
  const thisWeekStart = startOfWeek(now);
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(thisWeekStart.getTime() - i * 7 * DAY_MS);
    const ts = tasks.filter((t) => isInWeek(t.service ?? t.due, weekStart));
    const done = ts.filter((t) => t.done).length;
    buckets.push({
      weekStart,
      label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      total: ts.length,
      done,
      rate: ts.length > 0 ? done / ts.length : 0,
    });
  }
  return buckets;
}

export interface TeamMonthStat {
  team: Team;
  total: number;
  done: number;
  rate: number;
}

/** 이번 달(달력 월 기준) 팀별 완료율 */
export function monthlyTeamStats(tasks: Task[], teams: Team[], now: Date): TeamMonthStat[] {
  const key = monthKey(now);
  return teams.map((team) => {
    const ts = tasks.filter((t) => t.teamId === team.id && monthKey(new Date(t.service ?? t.due)) === key);
    const done = ts.filter((t) => t.done).length;
    return { team, total: ts.length, done, rate: ts.length > 0 ? done / ts.length : 0 };
  });
}

export interface ServedSummary {
  /** 완료한 업무가 하나라도 있는 서로 다른 (팀, 예배)의 수 */
  services: number;
  /** 가장 이른 완료 시각(ISO) — 없으면 null */
  sinceIso: string | null;
}

/**
 * 함께 준비한 예배 수 — '전부 끝냈는가'가 아니라 '함께했는가'를 센다.
 * 기준이 100%가 아니라 1건이라서 힘든 주에도 숫자가 오르고, 줄어들지 않는다.
 * 끊길 연속 기록이 없으니 실패 상태 자체가 존재하지 않는다(스트릭·배지를 쓰지 않는 이유).
 */
export function servedServices(tasks: Task[]): ServedSummary {
  const keys = new Set<string>();
  let earliest: string | null = null;
  for (const t of tasks) {
    if (!t.done || !t.doneAt) continue;
    keys.add(`${t.teamId}|${t.service ?? t.due}`);
    if (earliest === null || t.doneAt < earliest) earliest = t.doneAt;
  }
  return { services: keys.size, sinceIso: earliest };
}

/** 이번 달 완료율이 가장 높은 팀을 콕 집는 하이라이트 문장 — 데이터 없으면 null */
export function bestTeamHighlight(stats: TeamMonthStat[]): string | null {
  const withData = stats.filter((s) => s.total > 0);
  if (withData.length === 0) return null;
  const best = withData.reduce((a, b) => (b.rate > a.rate ? b : a));
  const pct = Math.round(best.rate * 100);
  return `이번 달은 ${best.team.shortName} 팀 준비가 가장 순조로워요 — 완료율 ${pct}%`;
}
