export type TeamId = string;
export type TeamColor = 'sage' | 'apricot' | 'mist' | 'clay' | 'lavender' | 'moss';

/** 라인업 역할 — 세션 6종 + 싱어 + 예배지원 2종 */
export type LineupRole =
  | 'main'
  | 'second'
  | 'acoustic'
  | 'electric'
  | 'bass'
  | 'drum'
  | 'singer'
  | 'engineer'
  | 'ppt';

export interface TeamMember {
  id: string;
  name: string;
  /** 한 사람이 여러 역할을 겸할 수 있음 (예: 세컨+싱어) */
  roles: LineupRole[];
}

export interface LineupSlot {
  role: LineupRole;
  /** 이 역할에 필요한 인원 수 (싱어는 보통 여러 명) */
  count: number;
}

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  serviceName: string;
  serviceDayLabel: string;
  /** 예배 요일: 0=일 … 6=토 (D-day·서비스 주 계산용) */
  serviceWeekday: number;
  /** 콘티 곡 수 */
  songCount: number;
  /** 교역자 호칭 (예: 청소년 전도사님, 목사님) */
  pastorLabel: string;
  color: TeamColor;
  /** 사용자가 추가한 팀 */
  custom?: boolean;
  /** 팀원 명단 (역할 포함) */
  members?: TeamMember[];
  /** 팀별 필요 라인업 구성 — 없으면 DEFAULT_LINEUP_SLOTS 사용 */
  lineupSlots?: LineupSlot[];
  /** 팀별로 따로 편집한 준비팩 단계 — 없으면 전역 WORSHIP_TEMPLATE 사용 */
  customTemplate?: TemplateStep[];
}

export interface Profile {
  name: string;
  church: string;
}

export interface TaskLink {
  label: string;
  url: string;
}

export interface TemplateStep {
  key: string;
  title: string;
  /** 예배일로부터 며칠 전 마감 */
  before: number;
  h: number;
  link?: TaskLink;
}

/** 확정된 라인업 배정 기록 — 로테이션 추천의 근거가 된다 */
export interface LineupAssignment {
  id: string;
  teamId: TeamId;
  /** 이 라인업이 적용되는 예배 날짜(ISO) */
  service: string;
  role: LineupRole;
  memberId: string;
  confirmedAt: string;
}

export interface Task {
  id: string;
  teamId: TeamId;
  title: string;
  /** ISO datetime — 마감 시각 */
  due: string;
  /** 이 업무가 속한 예배 날짜(ISO). 준비팩으로 생성된 업무에 부여 — 주 단위 묶음 기준 */
  service?: string;
  /** true면 시간 없이 '오늘까지'처럼 표기 */
  allDay?: boolean;
  done: boolean;
  doneAt?: string;
  /** 체크리스트 흐름 순서 (마감 동률일 때 선행 업무 우선) */
  order: number;
  isCustom?: boolean;
  link?: TaskLink;
}
