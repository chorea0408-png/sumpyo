import type { LineupSlot, Team, TeamColor, TeamId, TeamMember } from '../types';

/** 저채도 팀 색상 팔레트 — 새 팀은 이 순서로 배정 */
export const TEAM_COLORS: TeamColor[] = ['sage', 'apricot', 'mist', 'clay', 'lavender', 'moss'];

let seq = 0;
function member(name: string, roles: TeamMember['roles']): TeamMember {
  seq += 1;
  return { id: `demo-member-${seq}`, name, roles };
}

// 라온(청소년부)은 인원이 적어 일렉·드럼 없이 통기타 중심으로 운영 — 팀별 슬롯 커스터마이징 예시
const YOUTH_SLOTS: LineupSlot[] = [
  { role: 'main', count: 1 },
  { role: 'second', count: 1 },
  { role: 'acoustic', count: 1 },
  { role: 'bass', count: 1 },
  { role: 'singer', count: 4 },
  { role: 'engineer', count: 1 },
  { role: 'ppt', count: 1 },
];

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
    members: [
      member('김민준', ['main']),
      member('박서연', ['second', 'singer']),
      member('이도현', ['acoustic']),
      member('강태우', ['electric']),
      member('최지훈', ['bass']),
      member('정하은', ['drum']),
      member('오세영', ['singer']),
      member('김나윤', ['singer']),
      member('박권사님', ['engineer']),
      member('김집사님', ['ppt']),
    ],
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
    lineupSlots: YOUTH_SLOTS,
    members: [
      member('예소', ['main', 'singer']),
      member('은우', ['second']),
      member('은성', ['acoustic', 'drum']),
      member('하람', ['bass']),
      member('다은', ['singer']),
      member('소민', ['singer']),
      member('지안', ['singer']),
      member('유진', ['engineer', 'ppt']),
    ],
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
    members: [
      member('영광', ['main']),
      member('수현', ['second', 'singer']),
      member('준서', ['acoustic']),
      member('하진', ['electric']),
      member('도윤', ['bass']),
      member('시우', ['drum']),
      member('예린', ['singer']),
      member('서아', ['singer']),
      member('지호', ['singer']),
      member('민재', ['engineer']),
      member('하은', ['ppt']),
    ],
  },
];

export function findTeam(teams: Team[], id: TeamId): Team | undefined {
  return teams.find((t) => t.id === id);
}

export function nextColor(count: number): TeamColor {
  return TEAM_COLORS[count % TEAM_COLORS.length];
}
