import type { Task, Team, TeamId } from '../types';
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
  onOpenService: (teamId: TeamId, iso: string) => void;
  onViewAll: () => void;
}

/** 홈 화면용 요약 티저 — 팀당 가장 가까운 예배 1건만. 전체 목록은 캘린더 탭이 담당한다 */
export default function UpcomingServices({ teams, tasks, now, onOpenService, onViewAll }: Props) {
  const today = startOfDay(now).getTime();
  const rows: Row[] = [];

  for (const team of teams) {
    for (let w = 0; w < 8; w++) {
      const date = thisWeekServiceDate(team.serviceWeekday, addDays(now, w * 7));
      if (startOfDay(date).getTime() < today) continue;
      const iso = date.toISOString();
      const ts = tasks.filter((t) => t.teamId === team.id && t.service === iso);
      rows.push({ team, date, iso, total: ts.length, done: ts.filter((t) => t.done).length });
      break; // 팀당 가장 가까운 예배 1건만
    }
  }
  rows.sort((a, b) => a.date.getTime() - b.date.getTime());
  if (rows.length === 0) return null;

  return (
    <section className="card upcoming-svc">
      <p className="card-label">다가오는 예배</p>
      <ul>
        {rows.map((r) => (
          <li key={r.team.id}>
            <button
              className="svc-item"
              onClick={() => (r.total > 0 ? onOpenService(r.team.id, r.iso) : onViewAll())}
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
          </li>
        ))}
      </ul>
      <button className="svc-viewall" onClick={onViewAll}>
        캘린더에서 모두 보기 →
      </button>
    </section>
  );
}
