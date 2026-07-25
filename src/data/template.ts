import type { Task, TaskLink, Team, TemplateStep } from '../types';
import { addDays } from '../lib/date';

const REF: TaskLink = { label: '레퍼런스 음원', url: 'https://www.youtube.com' };
const SHEET: TaskLink = { label: '악보 시트', url: 'https://docs.google.com' };

export type { TemplateStep };

/** 예배마다 매주 반복되는 준비 루틴 — '통합팩'의 실체 (팀이 따로 편집하지 않았을 때 기본값) */
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

/**
 * 선행 단계 — 이 단계를 하려면 앞의 단계가 먼저 끝나 있어야 자연스럽다.
 * "앞 순서 전부"가 아니라 실제로 입력이 필요한 관계만 명시한다
 * (묵상이 안 끝났다고 콘티를 막으면 안 된다).
 * 기본 12단계 키에만 적용 — 사용자가 추가한 단계·메모는 절대 막지 않는다.
 */
export const STEP_PREREQS: Record<string, string[]> = {
  confirm: ['conti'],
  score: ['conti'],
  script: ['conti'],
  notice: ['conti'],
  teamNotice: ['conti', 'lineup'],
  practice: ['score'],
};

/** 긴 키를 먼저 봐야 'teamNotice'가 'notice'로 잘못 잡히지 않는다 */
const KNOWN_STEP_KEYS = WORSHIP_TEMPLATE.map((s) => s.key).sort((a, b) => b.length - a.length);

/**
 * 예전에 저장된 업무의 id 접미사에서 단계 키를 복원한다.
 * id는 `${idPrefix}-${step.key}` 형태인데 idPrefix 안에도 하이픈이 있어서
 * 마지막 하이픈으로 자르면 안 되고, 알려진 키로 접미사 매칭해야 한다.
 * 못 찾으면 undefined — 메모나 사용자가 만든 커스텀 단계다.
 */
export function inferStepKey(id: string, isCustom?: boolean): string | undefined {
  if (isCustom) return undefined;
  return KNOWN_STEP_KEYS.find((k) => id.endsWith(`-${k}`));
}

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

/** 한 예배(=한 주)의 준비 업무를 통째로 생성 — 팀이 준비팩을 따로 편집했으면 그 템플릿을, 아니면 기본값을 쓴다 */
export function makeWeekTasks(
  team: Team,
  serviceDate: Date,
  opts: { doneCount?: number; idPrefix: string },
): Task[] {
  const doneCount = opts.doneCount ?? 0;
  const service = serviceDate.toISOString();
  const template = team.customTemplate && team.customTemplate.length > 0 ? team.customTemplate : WORSHIP_TEMPLATE;
  return template.map((step, i) => {
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
      isLineupStep: step.key === 'lineup',
      stepKey: step.key,
    };
  });
}
