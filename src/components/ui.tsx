import type { Team, TeamColor } from '../types';
import type { DueInfo } from '../lib/date';

export function TeamChip({ team }: { team: Team }) {
  return <span className={`chip chip-${team.color}`}>{team.shortName}</span>;
}

export function DueBadge({ info }: { info: DueInfo }) {
  return <span className={`due due-${info.tone}`}>{info.label}</span>;
}

export function ProgressBar({ value, color }: { value: number; color?: TeamColor }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`fill${color ? ` fill-${color}` : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
