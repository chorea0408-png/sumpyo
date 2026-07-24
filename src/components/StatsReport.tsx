import type { Task, Team } from '../types';
import { bestTeamHighlight, monthlyTeamStats, weeklyTrend } from '../lib/stats';
import { ProgressBar } from './ui';

interface Props {
  tasks: Task[];
  teams: Team[];
  now: Date;
}

export default function StatsReport({ tasks, teams, now }: Props) {
  if (teams.length === 0) return null;

  const trend = weeklyTrend(tasks, now, 6);
  const monthly = monthlyTeamStats(tasks, teams, now);
  const highlight = bestTeamHighlight(monthly);

  return (
    <section className="card stats-report">
      <div className="stats-block">
        <p className="stats-subtitle">최근 6주 완료율 추이</p>
        <div className="stats-trend">
          {trend.map((w) => (
            <div key={w.label} className="stats-trend-col">
              <div className="stats-trend-bar">
                <div className="stats-trend-fill" style={{ height: `${Math.round(w.rate * 100)}%` }} />
              </div>
              <span className="stats-trend-label">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stats-block">
        <p className="stats-subtitle">이번 달 팀별 완료율</p>
        <ul className="stats-team-list">
          {monthly.map(({ team, done, total, rate }) => (
            <li key={team.id} className="stats-team-row">
              <span className="stats-team-name">{team.shortName}</span>
              <ProgressBar value={rate} color={team.color} label={`${team.shortName} 이번 달 완료율`} />
              <span className="stats-team-pct">{total > 0 ? `${done}/${total}` : '자료 없음'}</span>
            </li>
          ))}
        </ul>
      </div>

      {highlight && <p className="stats-highlight">{highlight}</p>}
    </section>
  );
}
