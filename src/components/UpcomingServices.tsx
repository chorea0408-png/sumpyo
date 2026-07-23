import type { Task, Team } from '../types';
import { addDays, ddayLabel, fmtDateShort, startOfDay, thisWeekServiceDate } from '../lib/date';
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
  weeksAhead?: number;
  onOpenService: (teamId: string, iso: string) => void;
  onAddPack: (teamId: string, iso: string) => void;
}

export default function UpcomingServices({
  teams,
  tasks,
  now,
  weeksAhead = 5,
  onOpenService,
  onAddPack,
}: Props) {
  const today = startOfDay(now).getTime();
  const rows: Row[] = [];

  for (const team of teams) {
    for (let w = 0; w < weeksAhead; w++) {
      const date = thisWeekServiceDate(team.serviceWeekday, addDays(now, w * 7));
      if (startOfDay(date).getTime() < today) continue; // 지난 예배 제외
      const iso = date.toISOString();
      const ts = tasks.filter((t) => t.teamId === team.id && t.service === iso);
      rows.push({ team, date, iso, total: ts.length, done: ts.filter((t) => t.done).length });
    }
  }

  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  const view = rows.slice(0, 8);
  if (view.length === 0) return null;

  return (
    <section className="card upcoming-svc">
      <p className="card-label">다가오는 예배</p>
      <ul>
        {view.map((r) => (
          <li key={`${r.team.id}-${r.iso}`} className="svc-item">
            <TeamChip team={r.team} />
            <div className="svc-main">
              <span className="svc-name">
                {r.team.serviceName}
                <span className="svc-date">{fmtDateShort(r.date)}</span>
              </span>
              <span className="svc-dday">{ddayLabel(r.date, now)}</span>
            </div>
            {r.total > 0 ? (
              <button className="svc-open" onClick={() => onOpenService(r.team.id, r.iso)}>
                {r.done}/{r.total}
              </button>
            ) : (
              <button className="svc-add" onClick={() => onAddPack(r.team.id, r.iso)}>
                준비팩 추가
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
