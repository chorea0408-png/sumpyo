import { useState } from 'react';
import type { Task, Team } from '../types';
import { DAY_MS, isInWeek, startOfWeek } from '../lib/date';
import { copyText, summaryText } from '../lib/share';
import { servedServices, serviceStepStates, stepPairGaps } from '../lib/stats';

type CopyState = 'idle' | 'ok' | 'fail';

export default function WeeklySummary({
  tasks,
  teams,
  now,
  signature,
}: {
  tasks: Task[];
  teams: Team[];
  now: Date;
  signature?: string;
}) {
  const [copied, setCopied] = useState<CopyState>('idle');

  const weekStart = startOfWeek(now);
  const from = weekStart.getTime();
  const to = from + 7 * DAY_MS;
  const belongsThisWeek = (t: Task) => isInWeek(t.service ?? t.due, weekStart);

  const doneThisWeek = tasks.filter((t) => {
    if (!t.done || !t.doneAt) return false;
    const ts = Date.parse(t.doneAt);
    return ts >= from && ts < to;
  }).length;

  // 팀별로 "진행 중"이 아니라 지금 걸려 있는 단계 이름을 보여준다 —
  // 세 팀이 각각 어디까지 왔는지가 이 카드 하나로 답이 된다.
  const steps = serviceStepStates(tasks, teams, weekStart);
  const per = teams.map((team, i) => {
    const ts = tasks.filter((t) => t.teamId === team.id && belongsThisWeek(t));
    return {
      team,
      complete: ts.length > 0 && ts.every((t) => t.done),
      nextStepTitle: steps[i]?.nextStepTitle ?? null,
    };
  });
  const allDone = per.length > 0 && per.every((p) => p.complete);

  /** 저자가 지목한 짝: 콘티는 정했는데 팀 공유는 아직인 예배 */
  const notSharedYet = stepPairGaps(steps, 'conti', 'teamNotice');

  const copy = async () => {
    const weekTasks = tasks.filter(belongsThisWeek);
    const ok = await copyText(summaryText(weekTasks, teams, now, signature));
    setCopied(ok ? 'ok' : 'fail');
    setTimeout(() => setCopied('idle'), 2500);
  };

  const copyLabel =
    copied === 'ok' ? '복사했어요 ✓' : copied === 'fail' ? '이 환경에선 복사가 막혀 있어요' : '주간 현황 복사';

  // 매주 0으로 돌아가는 카운터 말고, 쌓이기만 하는 한 줄 — 봉사자의 몇 달이 어딘가엔 남아야 한다
  const served = servedServices(tasks);
  const servedSince = served.sinceIso ? new Date(served.sinceIso) : null;
  const servedLine =
    served.services === 0
      ? null
      : servedSince
        ? `${servedSince.getFullYear()}년 ${servedSince.getMonth() + 1}월부터 ${served.services}번의 예배를 함께 준비했어요`
        : `${served.services}번의 예배를 함께 준비했어요`;

  return (
    <section className="card weekly">
      <p className="card-label">이번 주 완료 기록</p>
      <p className="weekly-count">
        <b>{doneThisWeek}</b>개의 준비를 마쳤어요
      </p>
      <ul className="svc-list">
        {per.map(({ team, complete, nextStepTitle }) => (
          <li key={team.id} className="svc-row">
            <span className={`dot dot-${team.color}${complete ? ' on' : ''}`} />
            <span>
              {team.shortName} {team.serviceName}
            </span>
            <span className={`svc-state${complete ? ' ok' : ''}`}>
              {complete ? '준비 완료' : (nextStepTitle ?? '진행 중')}
            </span>
          </li>
        ))}
      </ul>
      {notSharedYet.length > 0 && (
        <p className="weekly-gap">
          콘티는 정했지만 아직 공유 전 — {notSharedYet.map((t) => t.shortName).join(' · ')}
        </p>
      )}
      <p className="weekly-msg">
        {allDone ? '이번 주도 예배를 잘 준비했어요 🌿' : '차근차근, 잘 흘러가고 있어요 🌿'}
      </p>
      {servedLine && <p className="weekly-served">{servedLine}</p>}
      <button className="btn btn-soft" onClick={copy}>
        {copyLabel}
      </button>
      <p className="hint">카톡에 붙여넣어 팀과 공유할 수 있어요</p>
    </section>
  );
}
