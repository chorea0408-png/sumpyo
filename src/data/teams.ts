import type { Team, TeamColor, TeamId } from '../types';

/** 저채도 팀 색상 팔레트 — 새 팀은 이 순서로 배정 */
export const TEAM_COLORS: TeamColor[] = ['sage', 'apricot', 'mist', 'clay', 'lavender', 'moss'];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'senior',
    name: '브니엘 찬양팀',
    shortName: '브니엘',
    serviceName: '수요예배',
    serviceDayLabel: '수요일',
    serviceWeekday: 3,
    songCount: 3,
    pastorLabel: '서찬양 전도사님',
    color: 'sage',
  },
  {
    id: 'youth',
    name: '라온 찬양팀',
    shortName: '라온',
    serviceName: '주일예배',
    serviceDayLabel: '일요일',
    serviceWeekday: 0,
    songCount: 3,
    pastorLabel: '박기도 목사님',
    color: 'apricot',
  },
  {
    id: 'young',
    name: '엘림 찬양팀',
    shortName: '엘림',
    serviceName: '주일예배',
    serviceDayLabel: '일요일',
    serviceWeekday: 0,
    songCount: 4,
    pastorLabel: '강말씀 목사님',
    color: 'mist',
  },
];

export function findTeam(teams: Team[], id: TeamId): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function nextColor(count: number): TeamColor {
  return TEAM_COLORS[count % TEAM_COLORS.length];
}
