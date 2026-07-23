import type { Task, Team } from '../types';

const K_TASKS = 'sumpyo.v1';
const K_TEAMS = 'sumpyo.teams.v1';
const K_ENTERED = 'sumpyo.entered.v1';

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

export const loadTasks = () => read<Task[] | null>(K_TASKS, null);
export const saveTasks = (t: Task[]) => write(K_TASKS, t);

export const loadTeams = () => read<Team[] | null>(K_TEAMS, null);
export const saveTeams = (t: Team[]) => write(K_TEAMS, t);

export const loadEntered = () => read<boolean>(K_ENTERED, false);
export const saveEntered = (v: boolean) => write(K_ENTERED, v);

/** 데모 데이터 초기화 — 진입 여부(entered)는 유지 */
export function clearData(): void {
  localStorage.removeItem(K_TASKS);
  localStorage.removeItem(K_TEAMS);
}
