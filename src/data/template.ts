import type { Task, Team, TaskLink } from '../types';
import { addDays } from '../lib/date';

const REF: TaskLink = { label: '레퍼런스 음원', url: 'https://www.youtube.com' };
const SHEET: TaskLink = { label: '악보 시트', url: 'https://docs.google.com' };

export interface TemplateStep {
  key: string;
  title: string;
  /** 예배일로부터 며칠 전 마감 */
  before: number;
  h: number;
  link?: TaskLink;
}

/** 예배마다 매주 반복되는 준비 루틴 — '통합팩'의 실체 */
export const WORSHIP_TEMPLATE: TemplateStep[] = [
  { key: 'meditation', title: '묵상 · 예배 주제 정리', before: 6, h: 21 },
  { key: 'conti', title: '콘티 선정', before: 5, h: 21, link: REF },
  { key: 'confirm', title: '교역자 콘티 확인', before: 4, h: 12 },
  { key: 'score', title: '악보 · 송폼 정리', before: 4, h: 21, link: SHEET },
  { key: 'lineup', title: '라인업 확정', before: 3, h: 21 },
  { key: 'teamNotice', title: '팀 공지 보내기', before: 3, h: 21 },
  { key: 'notice', title: '전체 셋리스트 공지', before: 2, h: 18 },
  { key: 'script', title: '대본 스크립트 작성', before: 2, h: 21 },
  { key: 'practice', title: '개인 연습 (보컬 · 기타)', before: 1, h: 12 },
  { key: 'member', title: '팀원 특이사항 점검', before: 1, h: 20 },
  { key: 'gear', title: '음향 · 장비 세팅', before: 0, h: 8 },
  { key: 'finish', title: '예배 마침 기록', before: 0, h: 22 },
];

function stepTitle(step: TemplateStep, team: Team): string {
  if (step.key === 'conti') return `콘티 선정 (${team.songCount}곡)`;
  if (step.key === 'confirm') return `${team.pastorLabel} 콘티 확인`;
  if (step.key === 'finish') return `${team.serviceName} 마침 기록`;
  return step.title;
}

function dueAt(serviceDate: Date, before: number, h: number): string {
  const d = addDays(serviceDate, -before);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
}

/** 한 예배(=한 주)의 준비 업무 12건을 통째로 생성 */
export function makeWeekTasks(
  team: Team,
  serviceDate: Date,
  opts: { doneCount?: number; idPrefix: string },
): Task[] {
  const doneCount = opts.doneCount ?? 0;
  const service = serviceDate.toISOString();
  return WORSHIP_TEMPLATE.map((step, i) => {
    const due = dueAt(serviceDate, step.before, step.h);
    const done = i < doneCount;
    return {
      id: `${opts.idPrefix}-${step.key}`,
      teamId: team.id,
      title: stepTitle(step, team),
      due,
      service,
      allDay: false,
      done,
      doneAt: done ? due : undefined,
      order: i,
      link: step.link,
    };
  });
}
