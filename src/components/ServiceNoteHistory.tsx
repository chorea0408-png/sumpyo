import type { ServiceNote, TeamId } from '../types';
import { fmtDateShort } from '../lib/date';

interface Props {
  notes: ServiceNote[];
  teamId: TeamId;
}

const MAX_ROWS = 8;

/** 지난 예배들에 남긴 마침 기록 — 예배일 역순. LineupHistory와 같은 구조·같은 CSS */
export default function ServiceNoteHistory({ notes, teamId }: Props) {
  const rows = notes
    .filter((n) => n.teamId === teamId && n.text.trim())
    .slice()
    .sort((a, b) => (a.service < b.service ? 1 : a.service > b.service ? -1 : 0))
    .slice(0, MAX_ROWS);

  if (rows.length === 0) {
    return <p className="hint">아직 남긴 기록이 없어요. 체크리스트의 '마침 기록' 단계에서 적을 수 있어요.</p>;
  }

  return (
    <ul className="lineup-history-list">
      {rows.map((n) => (
        <li key={n.id} className="lineup-history-item">
          <p className="lineup-history-date">{fmtDateShort(new Date(n.service))}</p>
          <p className="note-text">{n.text}</p>
        </li>
      ))}
    </ul>
  );
}
