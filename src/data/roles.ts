import type { LineupRole, LineupSlot } from '../types';

export type RoleGroup = '세션' | '싱어' | '예배지원';

export interface RoleMeta {
  id: LineupRole;
  label: string;
  group: RoleGroup;
}

/** 라인업 역할 전체 목록 — 세션 6종 + 싱어 + 예배지원 2종 */
export const LINEUP_ROLES: RoleMeta[] = [
  { id: 'main', label: '메인', group: '세션' },
  { id: 'second', label: '세컨', group: '세션' },
  { id: 'acoustic', label: '통기타', group: '세션' },
  { id: 'electric', label: '일렉', group: '세션' },
  { id: 'bass', label: '베이스', group: '세션' },
  { id: 'drum', label: '드럼', group: '세션' },
  { id: 'singer', label: '싱어', group: '싱어' },
  { id: 'engineer', label: '엔지니어', group: '예배지원' },
  { id: 'ppt', label: 'PPT', group: '예배지원' },
];

export function roleLabel(role: LineupRole): string {
  return LINEUP_ROLES.find((r) => r.id === role)?.label ?? role;
}

/** 팀이 lineupSlots를 따로 정하지 않았을 때 쓰는 기본 구성 — 싱어는 5명 */
export const DEFAULT_LINEUP_SLOTS: LineupSlot[] = [
  { role: 'main', count: 1 },
  { role: 'second', count: 1 },
  { role: 'acoustic', count: 1 },
  { role: 'electric', count: 1 },
  { role: 'bass', count: 1 },
  { role: 'drum', count: 1 },
  { role: 'singer', count: 5 },
  { role: 'engineer', count: 1 },
  { role: 'ppt', count: 1 },
];

export function teamLineupSlots(slots: LineupSlot[] | undefined): LineupSlot[] {
  return slots && slots.length > 0 ? slots : DEFAULT_LINEUP_SLOTS;
}
