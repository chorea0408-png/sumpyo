import type { Task } from '../types';

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
