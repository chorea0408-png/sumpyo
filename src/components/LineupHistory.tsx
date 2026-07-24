import { useMemo } from 'react';
import type { LineupAssignment, Team } from '../types';
import { LINEUP_ROLES } from '../data/roles';
import { fmtDateShort, nextServiceOn } from '../lib/date';

interface Props {
  team: Team;
  now: Date;
  history: LineupAssignment[];
}

/** 끝없이 늘어나지 않도록 최근 확정된 서로 다른 예배일 8개까지만 보여준다 */
const MAX_PAST_SERVICES = 8;

export default function LineupHistory({ team, now, history }: Props) {
  const members = team.members ?? [];
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? '(삭제된 팀원)';

  const groups = useMemo(() => {
    const upcoming = nextServiceOn(team.serviceWeekday, now).toISOString();
    const own = history.filter((a) => a.teamId === team.id && a.service !== upcoming);

    const byService = new Map<string, LineupAssignment[]>();
    for (const a of own) {
      const list = byService.get(a.service) ?? [];
      list.push(a);
      byService.set(a.service, list);
    }

    return [...byService.entries()]
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, MAX_PAST_SERVICES)
      .map(([service, records]) => ({
        service,
        roles: LINEUP_ROLES.map((r) => ({
          label: r.label,
          names: records.filter((a) => a.role === r.id).map((a) => nameOf(a.memberId)),
        })).filter((r) => r.names.length > 0),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, team.id, team.serviceWeekday, now]);

  if (groups.length === 0) return null;

  return (
    <div className="lineup-history">
      <p className="lineup-history-label">지난 라인업 기록</p>
      <ul className="lineup-history-list">
        {groups.map(({ service, roles }) => (
          <li key={service} className="lineup-history-item">
            <p className="lineup-history-date">{fmtDateShort(new Date(service))}</p>
            <ul className="lineup-history-roles">
              {roles.map(({ label, names }) => (
                <li key={label} className="lineup-history-role-row">
                  <span className="lineup-role-label">{label}</span>
                  <span className="lineup-names">{names.join(', ')}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
