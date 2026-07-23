import type { Task, Team, TeamId } from '../types';
import { findTeam } from '../data/teams';
import { dueInfo } from '../lib/date';
import { DueBadge, TeamChip } from './ui';

interface Props {
  task: Task | null;
  teams: Team[];
  now: Date;
  onComplete: (id: string) => void;
  onOpenTeam: (teamId: TeamId) => void;
}

export default function NextAction({ task, teams, now, onComplete, onOpenTeam }: Props) {
  const team = task ? findTeam(teams, task.teamId) : undefined;

  if (!task || !team) {
    return (
      <section className="card hero">
        <p className="card-label">가장 먼저 할 일</p>
        <h2 className="hero-title">이번 주 준비를 모두 마쳤어요</h2>
        <p className="hero-sub">깊게 숨 한 번 쉬어가요 🌿</p>
      </section>
    );
  }

  const info = dueInfo(task.due, now, task.allDay);

  return (
    <section className="card hero">
      <p className="card-label">가장 먼저 할 일</p>
      <div className="hero-meta">
        <TeamChip team={team} />
        <DueBadge info={info} />
      </div>
      <h2 className="hero-title">{task.title}</h2>
      {info.sub && <p className="hero-sub">{info.sub}</p>}
      <div className="hero-actions">
        <button className="btn btn-primary" onClick={() => onComplete(task.id)}>
          완료로 표시
        </button>
        <button className="btn btn-ghost" onClick={() => onOpenTeam(task.teamId)}>
          팀 체크리스트 보기
        </button>
      </div>
    </section>
  );
}
