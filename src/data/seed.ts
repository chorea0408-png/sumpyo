import type { Task, Team, TeamId } from '../types';
import { addDays, startOfDay, startOfWeek, thisWeekServiceDate } from '../lib/date';
import { makeWeekTasks } from './template';

/** 이번 주 완료 단계 수로 세 팀의 서로 다른 상태를 만든다 */
// 시연일(7/24 금) 기준으로 세 상태가 또렷하게 보이도록 이번 주 완료 단계 수를 잡는다.
const STORY_DONE: Record<string, number> = {
  senior: 12, // 지난 수요예배 — 준비 완료 🌿
  youth: 6, // 주일 D-2 — 공지 단계까지 순항 중
  young: 4, // 주일 D-2 — 라인업이 밀려 '확인이 필요한' 팀
};

function customTask(
  id: string,
  teamId: TeamId,
  title: string,
  day: Date,
  hour: number,
  service: string,
  order: number,
): Task {
  const due = new Date(day);
  due.setHours(hour, 0, 0, 0);
  return {
    id,
    teamId,
    title,
    due: due.toISOString(),
    service,
    allDay: false,
    done: false,
    order,
    isCustom: true,
  };
}

/**
 * 6월 첫째 주 ~ 9월 말까지 해당 팀의 매주 준비팩을 생성한다.
 * skipIso에 있는 서비스 날짜(이번 주·다음 주 — 시연용 스토리로 이미 생성됨)는 건너뛴다.
 * 지난 서비스는 대부분 완료 처리(꾸준히 써온 도구처럼), 앞으로의 서비스는
 * 준비팩만 존재하고 미완료로 둔다(캘린더엔 보이되 '가장 먼저 할 일'엔 안 잡히게).
 */
function historyRangeTasks(team: Team, now: Date, skipIso: Set<string>): Task[] {
  const out: Task[] = [];
  const rangeStart = startOfWeek(new Date(now.getFullYear(), 5, 1)); // 6월 1일이 속한 주의 월요일
  const rangeEnd = new Date(now.getFullYear(), 9, 0); // 9월 30일 (10월의 0번째 날)
  const today = startOfDay(now).getTime();

  let cursor = thisWeekServiceDate(team.serviceWeekday, rangeStart);
  while (cursor.getTime() <= rangeEnd.getTime()) {
    const iso = cursor.toISOString();
    if (!skipIso.has(iso)) {
      const isPast = cursor.getTime() < today;
      const prefix = `${team.id}-hist-${iso.slice(0, 10)}`;
      out.push(...makeWeekTasks(team, cursor, { doneCount: isPast ? 12 : 0, idPrefix: prefix }));
    }
    cursor = addDays(cursor, 7);
  }
  return out;
}

/**
 * 시연 기준일(7/24 금) 주변으로 실제 달력에 맞춰 배치.
 * 각 팀마다 이번 주 예배(스토리) + 다음 주 예배(준비팩)를 우선 시드로 넣고,
 * 그 위에 6월 첫째 주 ~ 9월 말까지 전체 준비팩 이력을 덧붙인다.
 * 이름: 예소·은우·은성·영광·수현(청소년·청년) / 집사님·권사님(중장년) / 전도사님·목사님(교역자).
 */
export function makeSeed(teams: Team[], now: Date = new Date()): Task[] {
  const out: Task[] = [];

  for (const team of teams) {
    const thisService = thisWeekServiceDate(team.serviceWeekday, now);
    const nextService = thisWeekServiceDate(team.serviceWeekday, addDays(now, 7));
    out.push(
      ...makeWeekTasks(team, thisService, {
        doneCount: STORY_DONE[team.id] ?? 0,
        idPrefix: `${team.id}-w0`,
      }),
    );
    out.push(...makeWeekTasks(team, nextService, { doneCount: 0, idPrefix: `${team.id}-w1` }));

    const skip = new Set([thisService.toISOString(), nextService.toISOString()]);
    out.push(...historyRangeTasks(team, now, skip));
  }

  // 이름이 들어간 이번 주 커스텀 업무
  const youth = teams.find((t) => t.id === 'youth');
  if (youth) {
    const svc = thisWeekServiceDate(youth.serviceWeekday, now);
    const svcIso = svc.toISOString();
    out.push(customTask('c-youth-1', 'youth', '예소 생일 축하 순서 준비', svc, 13, svcIso, 100));
    out.push(
      customTask('c-youth-2', 'youth', '은우 시험기간 — 라인업 조정', addDays(svc, -1), 20, svcIso, 101),
    );
    out.push(customTask('c-youth-3', 'youth', '은성 형제 드럼 셋업 확인', svc, 9, svcIso, 102));
  }
  const young = teams.find((t) => t.id === 'young');
  if (young) {
    const svc = thisWeekServiceDate(young.serviceWeekday, now);
    const svcIso = svc.toISOString();
    out.push(
      customTask('c-young-1', 'young', '영광 형제 간증 순서 조율', addDays(svc, -1), 19, svcIso, 100),
    );
    out.push(customTask('c-young-2', 'young', '수현 자매 새 신자 환영 인사', svc, 12, svcIso, 101));
  }
  const senior = teams.find((t) => t.id === 'senior');
  if (senior) {
    // 지난 예배지만 다음 주를 위해 미리 챙길 항목 (다음 주 예배에 귀속)
    const svc = thisWeekServiceDate(senior.serviceWeekday, addDays(now, 7));
    const svcIso = svc.toISOString();
    out.push(customTask('c-senior-1', 'senior', '박 권사님 특송 반주 조율', addDays(svc, -2), 20, svcIso, 100));
    out.push(customTask('c-senior-2', 'senior', '김 집사님 헌금기도 순서 확인', addDays(svc, -2), 21, svcIso, 101));
  }

  return out;
}
