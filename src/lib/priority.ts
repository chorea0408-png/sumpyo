import type { Task, TeamId } from '../types';
import { STEP_PREREQS } from '../data/template';
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

export interface BlockedInfo {
  task: Task;
  /** 이 업무를 뒤로 미룬 선행 단계 */
  blockedBy: Task;
}

export interface HomeRanking {
  /** 지금 바로 손댈 수 있는 일 — 히어로 카드는 여기서만 뽑는다 */
  ready: Task[];
  /** 선행 단계가 남아 순서를 뒤로 미룬 일. 숨기지 않고 이유만 붙여 보여준다 */
  blocked: BlockedInfo[];
}

/**
 * 홈 전용 랭킹. 마감만 보고 줄을 세우면 "콘티도 안 정했는데 악보 정리부터 하세요"가
 * 최우선으로 올라올 수 있어서, 같은 팀·같은 예배 안에서 선행 단계가 남은 일은 뒤로 미룬다.
 *
 * 숨기지 않고 미루기만 하는 이유: 실제로 순서를 건너뛰어 일하는 경우가 정상적으로 있고,
 * 목록에서 사라지면 앱이 잃어버린 건지 사용자가 알 수 없다.
 */
export function rankForHome(tasks: Task[]): HomeRanking {
  // 남의 답을 기다리는 일은 지금 할 수 있는 일이 아니라 여기서 빠진다.
  // 대신 WaitingBoard가 항상 보여주기 때문에 사라지는 게 아니다.
  const sorted = pendingSorted(tasks.filter((t) => !t.waiting));
  const ready: Task[] = [];
  const blocked: BlockedInfo[] = [];

  for (const task of sorted) {
    const prereqs = task.stepKey ? STEP_PREREQS[task.stepKey] : undefined;
    const blocker = prereqs
      ? sorted.find(
          (o) =>
            o.teamId === task.teamId &&
            (o.service ?? '') === (task.service ?? '') &&
            !!o.stepKey &&
            prereqs.includes(o.stepKey),
        )
      : undefined;
    if (blocker) blocked.push({ task, blockedBy: blocker });
    else ready.push(task);
  }

  // 남은 일이 전부 blocked면 히어로가 비어 "모두 마쳤어요"라는 거짓말을 하게 된다.
  // 그럴 땐 미루기를 포기하고 전부 보여준다.
  if (ready.length === 0 && blocked.length > 0) {
    return { ready: sorted, blocked: [] };
  }
  return { ready, blocked };
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
      // 기다리는 중인 건 WaitingBoard가 따로 챙기므로 여기서 중복 노출하지 않는다
      if (t.done || t.waiting) return false;
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

/**
 * 마감이 지난 미완료 업무.
 * 답을 기다리는 중인 건 사용자 잘못이 아니므로 "확인이 필요해요" 집계에서 뺀다.
 */
export function overdue(tasks: Task[], now: Date): Task[] {
  const t = now.getTime();
  return tasks.filter((x) => !x.done && !x.waiting && new Date(x.due).getTime() < t);
}

export function dueToday(tasks: Task[], now: Date): Task[] {
  const sod = new Date(now);
  sod.setHours(0, 0, 0, 0);
  const eod = sod.getTime() + 86_400_000;
  return tasks.filter((x) => {
    if (x.done || x.waiting) return false;
    const d = new Date(x.due).getTime();
    return d >= now.getTime() && d < eod;
  });
}
