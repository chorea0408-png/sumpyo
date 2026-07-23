import type { Task, Team } from '../types';

const BACKUP_VERSION = 1;

interface BackupFile {
  app: 'sumpyo';
  version: number;
  exportedAt: string;
  teams: Team[];
  tasks: Task[];
}

function fmtStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function exportBackup(teams: Team[], tasks: Task[]): void {
  const payload: BackupFile = {
    app: 'sumpyo',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    teams,
    tasks,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sumpyo-backup-${fmtStamp(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; teams: Team[]; tasks: Task[] }
  | { ok: false; error: string };

function isTeam(x: unknown): x is Team {
  if (!x || typeof x !== 'object') return false;
  const t = x as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.shortName === 'string' && typeof t.serviceWeekday === 'number';
}

function isTask(x: unknown): x is Task {
  if (!x || typeof x !== 'object') return false;
  const t = x as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.teamId === 'string' && typeof t.due === 'string';
}

/** 백업 파일 읽기 — 형식이 다르면 실패 사유를 그대로 반환한다 */
export function parseBackup(raw: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: '올바른 JSON 파일이 아니에요' };
  }
  if (!data || typeof data !== 'object') return { ok: false, error: '백업 파일 형식이 아니에요' };
  const d = data as Record<string, unknown>;
  if (d.app !== 'sumpyo') return { ok: false, error: '숨표 백업 파일이 아니에요' };
  if (!Array.isArray(d.teams) || !d.teams.every(isTeam)) {
    return { ok: false, error: '팀 데이터가 손상되었어요' };
  }
  if (!Array.isArray(d.tasks) || !d.tasks.every(isTask)) {
    return { ok: false, error: '업무 데이터가 손상되었어요' };
  }
  return { ok: true, teams: d.teams, tasks: d.tasks };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
