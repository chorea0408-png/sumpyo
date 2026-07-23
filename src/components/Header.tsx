import type { Task } from '../types';
import { ddayLabel, fmtDateLine } from '../lib/date';
import { dueToday, overdue } from '../lib/priority';
import { ProgressBar } from './ui';

function greeting(hour: number): string {
  if (hour >= 5 && hour < 11) return '좋은 아침이에요, 인도자님';
  if (hour < 17) return '좋은 오후예요, 인도자님';
  if (hour < 22) return '오늘도 수고했어요, 인도자님';
  return '고요한 밤이에요, 인도자님';
}

interface Props {
  now: Date;
  tasks: Task[];
  nextServiceDate: Date | null;
}

export default function Header({ now, tasks, nextServiceDate }: Props) {
  const done = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const od = overdue(tasks, now).length;
  const today = dueToday(tasks, now).length;

  const status =
    od > 0
      ? `확인이 필요한 일이 ${od}건 있어요. 괜찮아요, 지금 살펴보면 돼요.`
      : today > 0
        ? `오늘 마감 ${today}건이 남아 있어요. 차근차근 진행해요.`
        : '이번 주 준비가 잘 흘러가고 있어요.';

  const dday = nextServiceDate ? ddayLabel(nextServiceDate, now) : null;

  return (
    <header className="container header">
      <p className="date-line">{fmtDateLine(now)}</p>
      <div className="greeting-row">
        <h1 className="greeting">{greeting(now.getHours())}</h1>
        {dday && <span className="next-dday">다음 예배 {dday}</span>}
      </div>
      <p className="status">{status}</p>
      <div className="overall card">
        <div className="overall-row">
          <span>이번 주 전체 준비</span>
          <b>
            {done}
            <span className="muted">/{total}</span>
          </b>
        </div>
        <ProgressBar value={total ? done / total : 0} />
      </div>
    </header>
  );
}
