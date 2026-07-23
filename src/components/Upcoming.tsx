import type { Task, Team, TeamId } from '../types';
import { findTeam } from '../data/teams';
import { dueInfo } from '../lib/date';
import { DueBadge, TeamChip } from './ui';

interface Props {
  tasks: Task[];
  teams: Team[];
  now: Date;
  onOpenTeam: (teamId: TeamId) => void;
}

export default function Upcoming({ tasks, teams, now, onOpenTeam }: Props) {
  if (tasks.length === 0) return null;
  return (
    <section className="card upcoming">
      <p className="card-label">다가오는 마감</p>
      <ul>
        {tasks.map((t) => {
          const team = findTeam(teams, t.teamId);
          if (!team) return null;
          return (
            <li key={t.id}>
              <button className="upcoming-row" onClick={() => onOpenTeam(t.teamId)}>
                <TeamChip team={team} />
                <span className="row-title">{t.title}</span>
                <DueBadge info={dueInfo(t.due, now, t.allDay)} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
