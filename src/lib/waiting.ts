import type { Task, TaskWaiting, TeamMember } from '../types';
import { DAY_MS, startOfDay } from './date';

/** 요청한 대상 이름 — 팀원이 지워졌어도 undefined를 그리지 않는다 */
export function waitingWho(w: TaskWaiting, members: TeamMember[]): string {
  if (w.whoMemberId) {
    return members.find((m) => m.id === w.whoMemberId)?.name ?? w.whoName ?? '(삭제된 팀원)';
  }
  return w.whoName ?? '';
}

/** 요청한 지 며칠 됐는지 — 날짜 단위, 음수는 0 */
export function waitingDays(since: string, now: Date): number {
  const diff = startOfDay(now).getTime() - startOfDay(new Date(since)).getTime();
  return Math.max(0, Math.round(diff / DAY_MS));
}

/** 기다리는 기간 표기 — 재촉하거나 탓하지 않는다 */
export function waitingLabel(days: number): string {
  if (days <= 0) return '오늘 요청했어요';
  if (days === 1) return '어제 요청했어요';
  return `${days}일째 기다리는 중`;
}

/** 오래 기다린 건에만 붙는 한 줄 — 제안이지 질책이 아니다 */
export const NUDGE_AFTER_DAYS = 7;

/** 답을 기다리는 중이라 지금은 손댈 수 없는 업무 — 오래 기다린 순 */
export function waitingTasks(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done && !!t.waiting)
    .slice()
    .sort((a, b) => (a.waiting!.since < b.waiting!.since ? -1 : a.waiting!.since > b.waiting!.since ? 1 : 0));
}
