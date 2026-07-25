import type { Task, Team, TeamId } from '../types';
import { findTeam } from '../data/teams';
import { NUDGE_AFTER_DAYS, waitingDays, waitingLabel, waitingWho } from '../lib/waiting';
import { TeamChip } from './ui';

interface Props {
  /** 이미 대기 순(오래된 순)으로 정렬돼 들어온다 */
  tasks: Task[];
  teams: Team[];
  now: Date;
  onResolve: (id: string) => void;
  onOpenTeam: (teamId: TeamId) => void;
}

const MAX_ROWS = 6;

/**
 * "요청했는데 아직 못 받은 것"을 한눈에 모아 보여준다.
 * 이 블록이 항상 보이기 때문에 대기 중인 일을 '가장 먼저 할 일'에서 빼도 안전하다 —
 * 빼기만 하고 여기 없으면 그건 숨기는 것이다.
 * 비어 있으면 아무것도 렌더하지 않는다.
 */
export default function WaitingBoard({ tasks, teams, now, onResolve, onOpenTeam }: Props) {
  if (tasks.length === 0) return null;
  const shown = tasks.slice(0, MAX_ROWS);

  return (
    <section className="card waiting-board">
      <p className="card-label">
        기다리는 중
        <span className="card-label-count">{tasks.length}건</span>
      </p>
      <ul>
        {shown.map((t) => {
          const team = findTeam(teams, t.teamId);
          const w = t.waiting!;
          const days = waitingDays(w.since, now);
          const who = waitingWho(w, team?.members ?? []);
          return (
            <li key={t.id} className="waiting-item">
              <button className="waiting-row" onClick={() => onOpenTeam(t.teamId)}>
                {team && <TeamChip team={team} />}
                <span className="waiting-body">
                  <span className="row-title">{t.title}</span>
                  <span className="waiting-sub">
                    {who && `${who} · `}
                    {waitingLabel(days)}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="waiting-resolve"
                onClick={() => onResolve(t.id)}
                aria-label={`${t.title} — 답 받았음으로 표시`}
              >
                답 받았어요
              </button>
            </li>
          );
        })}
      </ul>
      {shown.some((t) => waitingDays(t.waiting!.since, now) >= NUDGE_AFTER_DAYS) && (
        <p className="hint">한 번 더 여쭤봐도 괜찮아요</p>
      )}
    </section>
  );
}
