import type { Task, TeamId } from '../types';
import { teamById } from '../data/teams';
import { dueInfo } from '../lib/date';
import { DueBadge, TeamChip } from './ui';

interface Props {
  tasks: Task[];
  now: Date;
  onOpenTeam: (teamId: TeamId) => void;
}

export default function Upcoming({ tasks, now, onOpenTeam }: Props) {
  if (tasks.length === 0) return null;
  return (
    <section className="card upcoming">
      <p className="card-label">다가오는 마감</p>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <button className="upcoming-row" onClick={() => onOpenTeam(t.teamId)}>
              <TeamChip team={teamById(t.teamId)} />
              <span className="row-title">{t.title}</span>
              <DueBadge info={dueInfo(t.due, now, t.allDay)} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
