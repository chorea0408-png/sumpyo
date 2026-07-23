import type { Task, Team, TeamId } from '../types';
import {
  addDays,
  ddayLabel,
  fmtDateShort,
  fmtMonthLabel,
  monthKey,
  startOfDay,
  thisWeekServiceDate,
} from '../lib/date';
import { TeamChip } from './ui';

interface Row {
  team: Team;
  date: Date;
  iso: string;
  total: number;
  done: number;
}

interface Props {
  teams: Team[];
  tasks: Task[];
  now: Date;
  onOpenService: (teamId: TeamId, iso: string) => void;
  onAddPack: (teamId: TeamId, iso: string) => void;
}

/** 예배 단위 일정 — 상한 없이 미래 전체를 월별로 그룹핑한다 (개별 태스크·메모는 노출하지 않음) */
const WEEKS_AHEAD = 12;

export default function CalendarView({ teams, tasks, now, onOpenService, onAddPack }: Props) {
  const today = startOfDay(now).getTime();
  const rows: Row[] = [];

  for (const team of teams) {
    for (let w = 0; w < WEEKS_AHEAD; w++) {
      const date = thisWeekServiceDate(team.serviceWeekday, addDays(now, w * 7));
      if (startOfDay(date).getTime() < today) continue;
      const iso = date.toISOString();
      const ts = tasks.filter((t) => t.teamId === team.id && t.service === iso);
      rows.push({ team, date, iso, total: ts.length, done: ts.filter((t) => t.done).length });
    }
  }
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());

  const groups: { key: string; label: string; rows: Row[] }[] = [];
  for (const r of rows) {
    const key = monthKey(r.date);
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: fmtMonthLabel(r.date), rows: [] };
      groups.push(g);
    }
    g.rows.push(r);
  }

  return (
    <div className="container main calendar-view">
      <h1 className="cal-title">캘린더</h1>
      <p className="cal-sub">예배별 준비 일정이에요 · 자잘한 메모는 팀 체크리스트에서 볼 수 있어요</p>

      {groups.map((g) => (
        <section key={g.key} className="cal-month">
          <p className="cal-month-label">{g.label}</p>
          <div className="card cal-list">
            {g.rows.map((r) => (
              <button
                key={`${r.team.id}-${r.iso}`}
                className="svc-item"
                onClick={() =>
                  r.total > 0 ? onOpenService(r.team.id, r.iso) : onAddPack(r.team.id, r.iso)
                }
              >
                <TeamChip team={r.team} />
                <div className="svc-main">
                  <span className="svc-name">
                    {r.team.serviceName}
                    <span className="svc-date">{fmtDateShort(r.date)}</span>
                  </span>
                  <span className="svc-dday">{ddayLabel(r.date, now)}</span>
                </div>
                {r.total > 0 ? (
                  <span className="svc-open">
                    {r.done}/{r.total}
                  </span>
                ) : (
                  <span className="svc-add">준비팩 추가</span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
