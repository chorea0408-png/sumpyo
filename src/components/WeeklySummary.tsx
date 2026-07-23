import { useState } from 'react';
import type { Task } from '../types';
import { TEAMS } from '../data/teams';
import { DAY_MS, startOfWeek } from '../lib/date';
import { copyText, summaryText } from '../lib/share';

type CopyState = 'idle' | 'ok' | 'fail';

export default function WeeklySummary({ tasks, now }: { tasks: Task[]; now: Date }) {
  const [copied, setCopied] = useState<CopyState>('idle');

  const from = startOfWeek(now).getTime();
  const to = from + 7 * DAY_MS;
  const doneThisWeek = tasks.filter((t) => {
    if (!t.done || !t.doneAt) return false;
    const ts = Date.parse(t.doneAt);
    return ts >= from && ts < to;
  }).length;

  const per = TEAMS.map((team) => {
    const ts = tasks.filter((t) => t.teamId === team.id);
    return { team, complete: ts.length > 0 && ts.every((t) => t.done) };
  });
  const allDone = per.every((p) => p.complete);

  const copy = async () => {
    const ok = await copyText(summaryText(tasks, now));
    setCopied(ok ? 'ok' : 'fail');
    setTimeout(() => setCopied('idle'), 2500);
  };

  const copyLabel =
    copied === 'ok' ? '복사했어요 ✓' : copied === 'fail' ? '이 환경에선 복사가 막혀 있어요' : '주간 현황 복사';

  return (
    <section className="card weekly">
      <p className="card-label">이번 주 완료 기록</p>
      <p className="weekly-count">
        <b>{doneThisWeek}</b>개의 준비를 마쳤어요
      </p>
      <ul className="svc-list">
        {per.map(({ team, complete }) => (
          <li key={team.id} className="svc-row">
            <span className={`dot dot-${team.color}${complete ? ' on' : ''}`} />
            <span>
              {team.shortName} {team.serviceName}
            </span>
            <span className={`svc-state${complete ? ' ok' : ''}`}>{complete ? '준비 완료' : '진행 중'}</span>
          </li>
        ))}
      </ul>
      <p className="weekly-msg">
        {allDone ? '이번 주도 세 번의 예배를 잘 준비했어요 🌿' : '차근차근, 잘 흘러가고 있어요 🌿'}
      </p>
      <button className="btn btn-soft" onClick={copy}>
        {copyLabel}
      </button>
      <p className="hint">카톡에 붙여넣어 팀과 공유할 수 있어요</p>
    </section>
  );
}
