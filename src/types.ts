export type TeamId = 'senior' | 'youth' | 'young';
export type TeamColor = 'sage' | 'apricot' | 'mist';

export interface Team {
  id: TeamId;
  name: string;
  shortName: string;
  serviceName: string;
  serviceDayLabel: string;
  /** 예배 요일: 0=일 … 6=토 (D-day 계산용) */
  serviceWeekday: number;
  color: TeamColor;
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
  /** true면 시간 없이 '오늘까지'처럼 표기 */
  allDay?: boolean;
  done: boolean;
  doneAt?: string;
  /** 체크리스트 흐름 순서 (마감 동률일 때 선행 업무 우선) */
  order: number;
  isCustom?: boolean;
  link?: TaskLink;
}
