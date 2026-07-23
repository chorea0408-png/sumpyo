import type { Task, Team } from '../types';
import { ddayLabel, dueInfo, thisWeekServiceDate } from '../lib/date';
import { overdue, pendingSorted } from '../lib/priority';
import { DueBadge, ProgressBar, TeamChip } from './ui';

interface Props {
  team: Team;
  tasks: Task[];
  now: Date;
  onOpen: () => void;
}

export default function TeamCard({ team, tasks, now, onOpen }: Props) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const next = pendingSorted(tasks)[0];
  const alerts = overdue(tasks, now).length;
  const complete = total > 0 && done === total;
  const dday = ddayLabel(thisWeekServiceDate(team.serviceWeekday, now), now);

  return (
    <button className="card team-card" onClick={onOpen} aria-label={`${team.name} 체크리스트 열기`}>
      <div className="team-top">
        <TeamChip team={team} />
        <span className="team-service">
          {team.serviceName}
          <span className={`dday${dday === '오늘' ? ' now' : ''}`}>{dday}</span>
        </span>
      </div>
      <p className="team-count">
        {done}
        <span className="muted">/{total} 완료</span>
      </p>
      <ProgressBar value={total ? done / total : 0} color={team.color} />
      {complete ? (
        <p className="team-complete">이번 주 준비 완료 🌿</p>
      ) : (
        next && (
          <div className="team-next">
            <span className="team-next-title">다음 · {next.title}</span>
            <DueBadge info={dueInfo(next.due, now, next.allDay)} />
          </div>
        )
      )}
      {alerts > 0 && <p className="team-alert">확인이 필요한 일 {alerts}건</p>}
    </button>
  );
}
