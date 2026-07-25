import { useState } from 'react';
import type { Task, Team, TeamId } from '../types';
import { findTeam } from '../data/teams';
import { dueInfo } from '../lib/date';
import { DueBadge, TeamChip } from './ui';

export interface UpcomingRow {
  task: Task;
  /** 선행 단계가 남아 뒤로 미뤄진 경우, 그 선행 업무 */
  blockedBy?: Task;
}

interface Props {
  /** 히어로에 뽑히고 남은 전체 — 자르기는 이 컴포넌트가 결정한다 */
  rows: UpcomingRow[];
  teams: Team[];
  now: Date;
  onOpenTeam: (teamId: TeamId) => void;
}

/** 평소엔 3건만, 펼치면 이만큼까지 */
const VISIBLE = 3;
const MAX = 20;

export default function Upcoming({ rows, teams, now, onOpenTeam }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (rows.length === 0) return null;

  const shown = expanded ? rows.slice(0, MAX) : rows.slice(0, VISIBLE);
  const rest = rows.length - shown.length;

  return (
    <section className="card upcoming">
      <p className="card-label">
        다가오는 마감
        <span className="card-label-count">{rows.length}건</span>
      </p>
      <ul>
        {shown.map(({ task, blockedBy }) => {
          const team = findTeam(teams, task.teamId);
          if (!team) return null;
          return (
            <li key={task.id}>
              <button className="upcoming-row" onClick={() => onOpenTeam(task.teamId)}>
                <TeamChip team={team} />
                <span className="row-title">
                  {task.title}
                  {blockedBy && <em className="mini-tag">{blockedBy.title} 먼저</em>}
                </span>
                <DueBadge info={dueInfo(task.due, now, task.allDay)} />
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
      {expanded && rows.length > VISIBLE && (
        <button type="button" className="svc-viewall" onClick={() => setExpanded(false)}>
          접기
        </button>
      )}
    </section>
  );
}
