import type { Task, TeamId } from '../types';
import { DAY_MS, startOfWeek } from './date';

/**
 * 다음 행동 규칙: 마감 시각 오름차순 → 체크리스트 순서.
 * 마감 초과 → 오늘 → 내일 → 이후 순서가 자연스럽게 보장된다.
 */
export function pendingSorted(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => !t.done)
    .slice()
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.order - b.order));
}

/**
 * 지난 주(들)에 남겨둔 미완료 업무.
 * 홈은 이번 주만 보여주기 때문에, 이게 없으면 주 경계를 넘는 순간
 * 지난 주에 남긴 일이 화면에서 조용히 사라진다.
 */
export function carriedOver(tasks: Task[], weekStart: Date, weeksBack = 4): Task[] {
  const to = weekStart.getTime();
  const from = to - weeksBack * 7 * DAY_MS;
  return tasks
    .filter((t) => {
      if (t.done) return false;
      const at = new Date(t.service ?? t.due).getTime();
      return at >= from && at < to;
    })
    .slice()
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.order - b.order));
}

/**
 * 한 예배에 속한 업무 묶음 — 준비팩(service 일치)과 그 주에 마감이 걸린 메모를 함께 센다.
 * 체크리스트 진행률과 완료 축하가 서로 다른 기준을 쓰면
 * "12/13인데 모두 마쳤어요"가 뜨기 때문에, 정의를 여기 한 곳에만 둔다.
 */
export function serviceTasks(tasks: Task[], teamId: TeamId, service: string): Task[] {
  const week = startOfWeek(new Date(service)).getTime();
  return tasks.filter(
    (t) => t.teamId === teamId && startOfWeek(new Date(t.service ?? t.due)).getTime() === week,
  );
}

export function overdue(tasks: Task[], now: Date): Task[] {
  const t = now.getTime();
  return tasks.filter((x) => !x.done && new Date(x.due).getTime() < t);
}

export function dueToday(tasks: Task[], now: Date): Task[] {
  const sod = new Date(now);
  sod.setHours(0, 0, 0, 0);
  const eod = sod.getTime() + 86_400_000;
  return tasks.filter((x) => {
    if (x.done) return false;
    const d = new Date(x.due).getTime();
    return d >= now.getTime() && d < eod;
  });
}
