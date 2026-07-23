import type { Task } from '../types';

const KEY = 'sumpyo.v1';

export function load(): Task[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : null;
  } catch {
    return null;
  }
}

export function save(tasks: Task[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    // 저장 공간 문제 등은 조용히 무시 — 화면 상태는 유지된다
  }
}

export function clear(): void {
  localStorage.removeItem(KEY);
}
