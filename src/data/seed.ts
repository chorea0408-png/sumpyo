import type { Task, TaskLink, TeamId } from '../types';
import { atTime, startOfDay } from '../lib/date';

interface SeedRow {
  team: TeamId;
  title: string;
  /** 오늘 기준 일 오프셋: -1=어제, 0=오늘, 1=내일 … */
  day: number;
  h: number;
  m?: number;
  done?: boolean;
  doneDay?: number;
  doneH?: number;
  link?: TaskLink;
  custom?: boolean;
}

const REF_LINK: TaskLink = { label: '레퍼런스 음원', url: 'https://www.youtube.com' };
const SHEET_LINK: TaskLink = { label: '악보 시트', url: 'https://docs.google.com' };

/**
 * 데모가 어느 요일에 열려도 세 팀이 각기 다른 상태를 보여주도록 '오늘' 기준으로 배치한다:
 * - 중장년(지난 수요예배): 준비 완료 상태 — 완료 기록/보상 메시지 시연
 * - 청소년(주일 D-3): 어젯밤 라인업이 밀림 → '확인이 필요한 일' + 오늘 마감
 * - 청년(주일 D-3): 콘티부터 시작하는 초반 진행
 * 주간 리듬(콘티 → 악보·라인업 → 전체 공지 → 연습 → 예배)은 순서 그대로 유지.
 */
const ROWS: SeedRow[] = [
  // 중장년 — 수요예배 (지난 예배, 이번 주 준비 완료)
  { team: 'senior', title: '묵상 · 예배 주제 정리', day: -3, h: 12, done: true, doneDay: -3, doneH: 8 },
  { team: 'senior', title: '콘티 선정 (3곡)', day: -3, h: 21, done: true, doneDay: -3, doneH: 20, link: REF_LINK },
  { team: 'senior', title: '교역자 콘티 확인', day: -2, h: 12, done: true, doneDay: -2, doneH: 11 },
  { team: 'senior', title: '악보 · 송폼 정리', day: -2, h: 18, done: true, doneDay: -2, doneH: 17, link: SHEET_LINK },
  { team: 'senior', title: '라인업 확정', day: -2, h: 20, done: true, doneDay: -2, doneH: 19 },
  { team: 'senior', title: '팀 공지 보내기', day: -2, h: 21, done: true, doneDay: -2, doneH: 21 },
  { team: 'senior', title: '개인 연습 (보컬 · 기타)', day: -1, h: 12, done: true, doneDay: -1, doneH: 9 },
  { team: 'senior', title: '음향 · 장비 점검', day: -1, h: 17, done: true, doneDay: -1, doneH: 16 },
  { team: 'senior', title: '수요예배 마침 기록', day: -1, h: 21, done: true, doneDay: -1, doneH: 22 },

  // 청소년 — 주일예배 (어젯밤 라인업이 밀린 상태)
  { team: 'youth', title: '묵상 · 예배 주제 정리', day: -3, h: 10, done: true, doneDay: -3, doneH: 9 },
  { team: 'youth', title: '콘티 선정 (3곡)', day: -3, h: 18, done: true, doneDay: -3, doneH: 18, link: REF_LINK },
  { team: 'youth', title: '교역자 콘티 확인', day: -3, h: 21, done: true, doneDay: -3, doneH: 21 },
  { team: 'youth', title: '악보 · 송폼 공지', day: -1, h: 20, done: true, doneDay: -1, doneH: 20 },
  { team: 'youth', title: '라인업 확정', day: -1, h: 21 },
  { team: 'youth', title: '전체 셋리스트 공지', day: 0, h: 18 },
  { team: 'youth', title: '대본 스크립트 작성', day: 2, h: 21 },
  { team: 'youth', title: '지현이 생일 축하 준비', day: 3, h: 13, custom: true },
  { team: 'youth', title: '팀 연습 · 나눔 모임', day: 3, h: 14 },
  { team: 'youth', title: '주일예배 마침 기록', day: 4, h: 11 },

  // 청년 — 주일예배 (초반 단계)
  { team: 'young', title: '묵상 · 예배 주제 정리', day: -1, h: 21, done: true, doneDay: -1, doneH: 22 },
  { team: 'young', title: '콘티 선정 (4곡)', day: 0, h: 21, link: REF_LINK },
  { team: 'young', title: '교역자 콘티 확인', day: 1, h: 12 },
  { team: 'young', title: '악보 · 송폼 정리', day: 1, h: 21, link: SHEET_LINK },
  { team: 'young', title: '라인업 확정', day: 2, h: 18 },
  { team: 'young', title: '팀 공지 보내기', day: 2, h: 21 },
  { team: 'young', title: '대본 스크립트 작성', day: 3, h: 13 },
  { team: 'young', title: '팀 연습 · 나눔 모임', day: 3, h: 16 },
  { team: 'young', title: '음향 · 장비 세팅', day: 4, h: 9 },
  { team: 'young', title: '주일예배 마침 기록', day: 4, h: 13 },
];

export function makeSeed(now: Date = new Date()): Task[] {
  const today = startOfDay(now);
  return ROWS.map((r, i) => ({
    id: `seed-${i}`,
    teamId: r.team,
    title: r.title,
    due: atTime(today, r.day, r.h, r.m ?? 0),
    allDay: false,
    done: !!r.done,
    doneAt: r.done ? atTime(today, r.doneDay ?? r.day, r.doneH ?? r.h) : undefined,
    order: i,
    isCustom: r.custom,
    link: r.link,
  }));
}
