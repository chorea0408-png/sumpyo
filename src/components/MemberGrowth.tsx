import { useMemo } from 'react';
import type { LineupAssignment, Team } from '../types';
import { formatRoleCounts, memberGrowthHighlight, memberGrowthStats } from '../lib/growth';

interface Props {
  team: Team;
  now: Date;
  history: LineupAssignment[];
}

export default function MemberGrowth({ team, now, history }: Props) {
  const stats = useMemo(() => memberGrowthStats(team, history, now), [team, history, now]);
  const highlight = useMemo(() => memberGrowthHighlight(stats), [stats]);

  if (stats.length === 0) return null;

  return (
    <div className="member-growth">
      {highlight && <p className="stats-highlight">{highlight}</p>}
      <ul className="lineup-history-list">
        {stats.map(({ member, roleCounts }) => (
          <li key={member.id} className="lineup-history-role-row">
            <span className="lineup-role-label">{member.name}</span>
            <span className="lineup-names">{formatRoleCounts(roleCounts)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
