import { useState } from 'react';
import type { Task, Team, TeamId } from '../types';
import { findTeam } from '../data/teams';
import { dueInfo } from '../lib/date';
import { DueBadge, TeamChip } from './ui';

interface Props {
  /** 히어로에 뽑히고 남은 전체 — 자르기는 이 컴포넌트가 결정한다 */
  tasks: Task[];
  teams: Team[];
  now: Date;
  onOpenTeam: (teamId: TeamId) => void;
}

/** 평소엔 3건만, 펼치면 이만큼까지 */
const VISIBLE = 3;
const MAX = 20;

export default function Upcoming({ tasks, teams, now, onOpenTeam }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (tasks.length === 0) return null;

  const shown = expanded ? tasks.slice(0, MAX) : tasks.slice(0, VISIBLE);
  const rest = tasks.length - shown.length;

  return (
    <section className="card upcoming">
      <p className="card-label">
        다가오는 마감
        <span className="card-label-count">{tasks.length}건</span>
      </p>
      <ul>
        {shown.map((t) => {
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
      {rest > 0 && (
        <button type="button" className="svc-viewall" onClick={() => setExpanded(true)}>
          그 외 {rest}건 더 보기 →
        </button>
      )}
      {expanded && tasks.length > VISIBLE && (
        <button type="button" className="svc-viewall" onClick={() => setExpanded(false)}>
          접기
        </button>
      )}
    </section>
  );
}
