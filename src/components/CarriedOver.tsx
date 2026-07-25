import type { Task, Team } from '../types';
import { findTeam } from '../data/teams';
import { fmtDateShort } from '../lib/date';
import { TeamChip } from './ui';

interface Props {
  tasks: Task[];
  teams: Team[];
  /** carriedOver()에 넘긴 값과 같아야 안내 문구가 사실이 된다 */
  weeksBack: number;
  onToggle: (id: string) => void;
}

const MAX_ROWS = 8;

/**
 * 홈은 이번 주만 보여주기 때문에, 주 경계를 넘으면 지난 주에 남긴 일이 화면에서 사라진다.
 * 그렇다고 이번 주 목록에 섞으면 홈이 무거워지므로, 기본은 접힌 채로 따로 둔다.
 * 비어 있으면 아무것도 렌더하지 않는다 — 남긴 일이 없는 사람의 홈은 지금과 똑같아야 한다.
 */
export default function CarriedOver({ tasks, teams, weeksBack, onToggle }: Props) {
  if (tasks.length === 0) return null;
  const shown = tasks.slice(0, MAX_ROWS);

  return (
    <details className="tm-section">
      <summary className="tm-section-label">
        지난주에 남겨둔 일
        <span className="tm-section-hint">{tasks.length}건</span>
      </summary>
      {/* .checklist 자체가 카드 배경을 갖고 있어 바깥에 .card를 또 두르지 않는다 */}
      <>
        <ul className="checklist">
          {shown.map((t) => {
            const team = findTeam(teams, t.teamId);
            return (
              <li key={t.id} className="check-item">
                <div className="check-line">
                  <button
                    className="check-row"
                    aria-pressed={false}
                    aria-label={`${t.title} — 완료로 표시`}
                    onClick={() => onToggle(t.id)}
                  >
                    <span className="check-circle" aria-hidden>
                      ✓
                    </span>
                    <span className="check-body">
                      <span className="check-title">
                        {t.title}
                        {team && <TeamChip team={team} />}
                      </span>
                      <span className="check-sub">
                        {fmtDateShort(new Date(t.due))}에 예정됐던 일이에요
                      </span>
                    </span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="hint">
          {weeksBack}주 전까지 보여드려요 · 그 전 기록은 팀 체크리스트에서 볼 수 있어요
        </p>
      </>
    </details>
  );
}
