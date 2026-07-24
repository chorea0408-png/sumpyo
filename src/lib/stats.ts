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

/** 이번 달 완료율이 가장 높은 팀을 콕 집는 하이라이트 문장 — 데이터 없으면 null */
export function bestTeamHighlight(stats: TeamMonthStat[]): string | null {
  const withData = stats.filter((s) => s.total > 0);
  if (withData.length === 0) return null;
  const best = withData.reduce((a, b) => (b.rate > a.rate ? b : a));
  const pct = Math.round(best.rate * 100);
  return `이번 달은 ${best.team.shortName} 팀 준비가 가장 순조로워요 — 완료율 ${pct}%`;
}
