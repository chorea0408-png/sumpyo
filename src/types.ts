export type TeamId = string;
export type TeamColor = 'sage' | 'apricot' | 'mist' | 'clay' | 'lavender' | 'moss';

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
  /** 팀원 이름 목록 */
  members?: string[];
}

export interface Profile {
  name: string;
  church: string;
}

export interface TaskLink {
  label: string;
  url: string;
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
