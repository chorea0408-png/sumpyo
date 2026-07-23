import type { Team, TeamId } from '../types';

export const TEAMS: Team[] = [
  {
    id: 'senior',
    name: '중장년 찬양팀',
    shortName: '중장년',
    serviceName: '수요예배',
    serviceDayLabel: '수요일',
    serviceWeekday: 3,
    color: 'sage',
  },
  {
    id: 'youth',
    name: '청소년 찬양팀',
    shortName: '청소년',
    serviceName: '주일예배',
    serviceDayLabel: '일요일',
    serviceWeekday: 0,
    color: 'apricot',
  },
  {
    id: 'young',
    name: '청년 찬양팀',
    shortName: '청년',
    serviceName: '주일예배',
    serviceDayLabel: '일요일',
    serviceWeekday: 0,
    color: 'mist',
  },
];

export function teamById(id: TeamId): Team {
  return TEAMS.find((t) => t.id === id)!;
}
