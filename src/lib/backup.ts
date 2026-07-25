import type { LineupAssignment, Profile, ServiceNote, SetlistSong, Task, Team } from '../types';
import { migrateMembers, migrateStepKeys } from './storage';

const BACKUP_VERSION = 1;

interface BackupFile {
  app: 'sumpyo';
  version: number;
  exportedAt: string;
  teams: Team[];
  tasks: Task[];
  profile?: Profile;
  lineup?: LineupAssignment[];
  notes?: ServiceNote[];
  setlist?: SetlistSong[];
}

function fmtStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function exportBackup(
  teams: Team[],
  tasks: Task[],
  profile?: Profile,
  lineup?: LineupAssignment[],
  notes?: ServiceNote[],
  setlist?: SetlistSong[],
): void {
  const payload: BackupFile = {
    app: 'sumpyo',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    teams,
    tasks,
    profile,
    lineup,
    notes,
    setlist,
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
  | {
      ok: true;
      teams: Team[];
      tasks: Task[];
      profile: Profile | null;
      lineup: LineupAssignment[];
      notes: ServiceNote[];
      setlist: SetlistSong[];
    }
  | { ok: false; error: string };

function isTeam(x: unknown): x is Team {
  if (!x || typeof x !== 'object') return false;
  const t = x as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.shortName === 'string' && typeof t.serviceWeekday === 'number';
}

function isProfile(x: unknown): x is Profile {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return typeof p.name === 'string' && typeof p.church === 'string';
}

function isTask(x: unknown): x is Task {
  if (!x || typeof x !== 'object') return false;
  const t = x as Record<string, unknown>;
  return typeof t.id === 'string' && typeof t.teamId === 'string' && typeof t.due === 'string';
}

function isServiceNote(x: unknown): x is ServiceNote {
  if (!x || typeof x !== 'object') return false;
  const n = x as Record<string, unknown>;
  return typeof n.id === 'string' && typeof n.teamId === 'string' && typeof n.text === 'string';
}

function isSetlistSong(x: unknown): x is SetlistSong {
  if (!x || typeof x !== 'object') return false;
  const s = x as Record<string, unknown>;
  return typeof s.id === 'string' && typeof s.teamId === 'string' && typeof s.title === 'string';
}

function isLineupAssignment(x: unknown): x is LineupAssignment {
  if (!x || typeof x !== 'object') return false;
  const a = x as Record<string, unknown>;
  return typeof a.id === 'string' && typeof a.teamId === 'string' && typeof a.memberId === 'string';
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
  const profile = isProfile(d.profile) ? d.profile : null;
  // 신규 배열은 관용적으로 걸러낸다 — .every()로 검사하면 한 줄 때문에 백업 전체가 복원 불가가 된다
  const lineup = Array.isArray(d.lineup) ? d.lineup.filter(isLineupAssignment) : [];
  const notes = Array.isArray(d.notes) ? d.notes.filter(isServiceNote) : [];
  const setlist = Array.isArray(d.setlist) ? d.setlist.filter(isSetlistSong) : [];
  // 옛 버전 백업도 storage와 동일하게 마이그레이션 — 팀원 스키마와 단계 키 둘 다
  const teams = d.teams.map((t) => ({ ...t, members: migrateMembers(t.members) }));
  const tasks = migrateStepKeys(d.tasks);
  return { ok: true, teams, tasks, profile, lineup, notes, setlist };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
