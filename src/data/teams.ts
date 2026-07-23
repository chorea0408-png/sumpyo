import type { Team, TeamColor, TeamId } from '../types';

/** 저채도 팀 색상 팔레트 — 새 팀은 이 순서로 배정 */
export const TEAM_COLORS: TeamColor[] = ['sage', 'apricot', 'mist', 'clay', 'lavender', 'moss'];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'senior',
    name: '중장년 찬양팀',
    shortName: '중장년',
    serviceName: '수요예배',
    serviceDayLabel: '수요일',
    serviceWeekday: 3,
    songCount: 3,
    pastorLabel: '목사님',
    color: 'sage',
  },
  {
    id: 'youth',
    name: '청소년 찬양팀',
    shortName: '청소년',
    serviceName: '주일예배',
    serviceDayLabel: '일요일',
    serviceWeekday: 0,
    songCount: 3,
    pastorLabel: '청소년 전도사님',
    color: 'apricot',
  },
  {
    id: 'young',
    name: '청년 찬양팀',
    shortName: '청년',
    serviceName: '주일예배',
    serviceDayLabel: '일요일',
    serviceWeekday: 0,
    songCount: 4,
    pastorLabel: '목사님',
    color: 'mist',
  },
];

export function findTeam(teams: Team[], id: TeamId): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function nextColor(count: number): TeamColor {
  return TEAM_COLORS[count % TEAM_COLORS.length];
}
