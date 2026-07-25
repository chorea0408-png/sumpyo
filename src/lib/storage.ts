import type { LineupAssignment, Profile, Task, Team, TeamMember } from '../types';
import { inferStepKey } from '../data/template';

const K_TASKS = 'sumpyo.v1';
const K_TEAMS = 'sumpyo.teams.v1';
const K_ENTERED = 'sumpyo.entered.v1';
const K_PROFILE = 'sumpyo.profile.v1';
const K_LINEUP = 'sumpyo.lineup.v1';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 공간 문제 등은 조용히 무시 — 화면 상태는 유지된다
  }
}

/** stepKey가 없던 시절에 저장된 업무에 단계 키를 복원해준다 (id 접미사 기준) */
export function migrateStepKeys(tasks: Task[]): Task[] {
  return tasks.map((t) => (t.stepKey ? t : { ...t, stepKey: inferStepKey(t.id, t.isCustom) }));
}

export const loadTasks = () => {
  const tasks = read<Task[] | null>(K_TASKS, null);
  if (!Array.isArray(tasks)) return null;
  return migrateStepKeys(tasks);
};
export const saveTasks = (t: Task[]) => write(K_TASKS, t);

/** 옛 버전(팀원=이름 문자열 배열)으로 저장된 데이터를 TeamMember[]로 변환 */
export function migrateMembers(raw: unknown): TeamMember[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((m, i) =>
    typeof m === 'string' ? { id: `legacy-${i}-${m}`, name: m, roles: [] } : (m as TeamMember),
  );
}

export const loadTeams = () => {
  const teams = read<Team[] | null>(K_TEAMS, null);
  if (!Array.isArray(teams)) return null;
  return teams.map((t) => ({ ...t, members: migrateMembers(t.members) }));
};
export const saveTeams = (t: Team[]) => write(K_TEAMS, t);

export const loadEntered = () => read<boolean>(K_ENTERED, false);
export const saveEntered = (v: boolean) => write(K_ENTERED, v);

export const loadProfile = () => read<Profile | null>(K_PROFILE, null);
export const saveProfile = (p: Profile) => write(K_PROFILE, p);

export const loadLineup = () => read<LineupAssignment[]>(K_LINEUP, []);
export const saveLineup = (l: LineupAssignment[]) => write(K_LINEUP, l);

/** 데모 데이터 초기화 — 진입 여부(entered)는 유지 */
export function clearData(): void {
  localStorage.removeItem(K_TASKS);
  localStorage.removeItem(K_TEAMS);
  localStorage.removeItem(K_LINEUP);
}
